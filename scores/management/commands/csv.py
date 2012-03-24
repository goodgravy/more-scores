from django.core.management.base import BaseCommand

from scores import lib, models

def wins(user):
	result = []
	for res in models.Result.objects.filter(winner__in=user.team_set.all()).order_by('played').all():
		result.append((res, res.pointschange_set.get(user=user).points))
	return result

def losses(user):
	result = []
	for res in models.Result.objects.filter(loser__in=user.team_set.all()).order_by('played').all():
		result.append((res, res.pointschange_set.get(user=user).points))
	return result

class Command(BaseCommand):
	help = '''output csv of historical scores
'''

	requires_model_validation = True
	can_import_settings = True
	
	def handle(self, *args, **options):
		users = models.User.objects.all()
		print ','.join(['date']+[user.username for user in users])

		for result in models.Result.objects.order_by('played').all():
			output_list = [str(result.played)]
			for user in users:
				output_list.append(str(lib.points_memo.get_points_after_result(result, user)))
				
			print ','.join(output_list)
