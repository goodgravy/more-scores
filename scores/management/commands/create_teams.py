from django.core.management.base import BaseCommand

from scores import models

class Command(BaseCommand):
	help = '''ensure that all users have all possible teams created for them'''

	requires_model_validation = True
	can_import_settings = True

	def handle(self, *args, **options):
		users = models.User.objects.all()
		for user in users:
			teams = models.Team.objects.filter(users=user)
			def solo_team(team):
				return team.users.count() == 1
			if not any(map(solo_team, teams)):
				# no individual teams for this user
				print 'creating new solo team for', user
				team = models.Team()
				team.save()
				team.users.add(user)
				team.save()

			for other_user in users:
				if not teams.filter(users=other_user):
					print 'creating new team for', user, 'and', other_user
					team = models.Team()
					team.save()
					team.users.add(user)
					team.users.add(other_user)
					team.save()


