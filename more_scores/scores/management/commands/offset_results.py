from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError

from scores import models

class Command(BaseCommand):
	help = '''Creation of results as DateFields has meant that stretches of results
seemed to occur at the same instant: add 1 second delays between results
where necessary
'''

	requires_model_validation = True
	can_import_settings = True
	
	def handle(self, *args, **options):
		results = models.Result.objects.order_by('played').all()
		old_played = results[0].played
		offset = timedelta(seconds=1)
		
		for result in results[1:]:
			if result.played <= old_played:
				result.played = old_played + offset
				result.save()
				
				print result, result.played
			old_played = result.played
