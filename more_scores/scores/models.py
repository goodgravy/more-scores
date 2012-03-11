from collections import defaultdict

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
	
	def __unicode__(self):
		return '{user}'.format(
			user=self.user,
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
	winners = models.ForeignKey(Team, related_name='results_won')
	losers = models.ForeignKey(Team, related_name='results_lost')
	
	def __unicode__(self):
		return '{winners} beat {losers} ({played})'.format(
			winners=self.winners, losers=self.losers, played=self.played,
		)
