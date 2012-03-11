from djangorestframework.resources import ModelResource

from scores import forms, models

class ResultResource(ModelResource):
	model = models.Result
	form = forms.ResultForm
	fields = [ "id", ("winners", "winners"), ("losers", "losers"), "played" ]
	def winners(self, instance):
		return instance.winners.users.all().values(*UserResource.fields)
	def losers(self, instance):
		return instance.losers.users.all().values(*UserResource.fields)
		
class UserResource(ModelResource):
	model = models.User
	fields = ["id", "date_joined", "first_name", "last_name", "username"]


