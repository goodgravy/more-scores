users = [
  {
    "username": "james", 
    "first_name": "James", 
    "last_name": "Brady", 
  }, 
  {
    "username": "connor", 
    "first_name": "Connor", 
    "last_name": "Dunn", 
  }, 
  {
    "username": "tim", 
    "first_name": "Tim", 
    "last_name": "Monks", 
  }, 
  {
    "username": "tris", 
    "first_name": "Tris", 
    "last_name": "Oaten", 
  }, 
  {
    "username": "jeremy", 
    "first_name": "Jeremy", 
    "last_name": "Kingsley", 
  }, 
  {
    "username": "sahil", 
    "first_name": "Sahil", 
    "last_name": "", 
  }, 
  {
    "username": "amir", 
    "first_name": "Amir", 
    "last_name": "Nathoo", 
  }, 
  {
    "username": "russ", 
    "first_name": "Russ", 
    "last_name": "Middleton", 
  }, 
  {
    "username": "clark", 
    "first_name": "Clark", 
    "last_name": "Gates-George", 
  }, 
  {
    "username": "david", 
    "first_name": "David", 
    "last_name": "Kidger", 
  }
]

for user in users[1:]:
	print """
curl -v -X POST \
  -H "X-Parse-Application-Id: {APPLICATION_ID}" \
  -H "X-Parse-REST-API-Key: {REST_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{{"username": "{username}", "password": "{username}", "first_name": "{first_name}", "last_name": "{last_name}" }}' \
  https://api.parse.com/1/users
  """.format(
		APPLICATION_ID="LwvhP24g9g3LRFRWohv2n5kMfpyp7My7Nbj0P4ah",
		REST_API_KEY="7E77gMuTAjNMxhlJBB2K48ePDoNhRyYvQLmEvBrB",
		username=user["username"],
		first_name=user["first_name"],
		last_name=user["last_name"],
	)


