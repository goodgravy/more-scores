from django.core.management.base import BaseCommand, CommandError

from scores import models

class Command(BaseCommand):
	help = 'Re-calculates the scores for all Results'

	requires_model_validation = True
	can_import_settings = True
	
	def handle(self, *args, **options):
		for result in models.Result.objects.order_by('played').all():
			result.save()
			print result