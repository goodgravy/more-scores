from collections import defaultdict
import math
from operator import add

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save


# will be user_id -> datetime -> score cache
_score_memo = defaultdict(dict)

class UserProfile(models.Model):
	'''Extra data to store about a user
	'''
	# This is the only required field
	user = models.ForeignKey(User, unique=True)
	total_points = models.IntegerField(default=0)
	
	def current_score(self, at=None):
		if at is not None and at in _score_memo[self.user.id]:
			return _score_memo[self.user.id][at]
			
		points_changes = PointsChange.objects.filter(user=self.user)
		if at is not None:
			points_changes = points_changes.filter(result__played__lte=at)
		
		result = reduce(add,
			[points_change.points for points_change in points_changes],
			0
		)
		_score_memo[self.user.id][at] = result
		return result
	
	def __unicode__(self):
		return '{user}: {points}'.format(
			user=self.user,
			points=self.total_points,
		)

def create_user_profile(sender, instance, created, **kwargs):
	'Ensure all users have :class:`UserProfiles`'
	if created:
		UserProfile.objects.create(user=instance)
post_save.connect(create_user_profile, sender=User)

class Team(models.Model):
	users = models.ManyToManyField(User)
	
	def current_score(self, at=None):
		user_scores = [user.get_profile().current_score(at=at) for user in self.users.all()]
		return sum(user_scores) / len(user_scores)
	
	def __unicode__(self):
		return ' and '.join(str(user) for user in self.users.all())

class Result(models.Model):
	class Meta(object):
		ordering = ('-played',)	
	
	played = models.DateTimeField()
	winner = models.ForeignKey(Team, related_name='won_results')
	loser = models.ForeignKey(Team, related_name='lost_results')
	points = models.IntegerField(editable=False)
	
	def save(self, *args, **kw):
		self.points = PointsChange.calculate_points(self)
		super(Result, self).save(*args, **kw)
		
		for team, multiplier in ((self.winner, 1), (self.loser, -1)):
			for player in team.users.all():
				points_change, created = PointsChange.objects.get_or_create(
					user=player,
					result=self,
				)
				points_change.points = self.points * multiplier
				points_change.save()
		
	def __unicode__(self):
		return '{winner} beat {loser} ({points} points on {played})'.format(
			winner=self.winner, loser=self.loser, points=self.points, played=self.played,
		)

class PointsChange(models.Model):
	user = models.ForeignKey(User)
	points = models.IntegerField()
	result = models.ForeignKey(Result)
	
	@staticmethod
	def calculate_points(result):
		'''Adjust the points for a particular result, based on past form.
		
		* evenly matched players result in a 100 point match
		* players mismatched by 200 points result in a 62 point match (or 137 if it goes against the form)
		* players mismatched by 400 points result in a 33 point match (or 166 if it goes against the form)
		'''
		winner = result.winner
		loser = result.loser
		points_diff = winner.current_score(at=result.played) - loser.current_score(at=result.played)
		
		return math.floor(50 * math.tanh(points_diff / -500.) + 100)
	
	def __unicode__(self):
		return "{user}: {points}".format(
			user=self.user,
			points=self.points
		)
