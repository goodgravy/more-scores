from django.core.management.base import BaseCommand, CommandError

from scores import models

class Command(BaseCommand):
	help = 'Creates empty UserProfiles for users without them'

	requires_model_validation = True
	can_import_settings = True

	def handle(self, *args, **options):
		for user in models.User.objects.all():
			try:
				user.get_profile()
			except models.UserProfile.DoesNotExist:
				profile = models.UserProfile(user=user)
				profile.save()
				print 'created new UserProfile {profile}'.format(profile=profile)