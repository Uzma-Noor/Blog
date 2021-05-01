# Blog

1. Give proper mongoose atlas db connection in your app.js (in atlas go to connect and copy url and replace with your db name)
2. upload project in git
3. Upload Procfile with content as (web: node app.js) in git repo to mention the starting point.
4. login to heroku in cmd as ' heroku login 'or web 
5. create app from ui or from cmd by using "heroku create"
6. Do npm install in cmd
7. In UI Goto deploy -> choose git -> select the repo-> enable auto updates -> click select branch -> deploy branch
8. Go to settings -> config vars -> give your .env variables like api_id, secrets etc
	or use terminal and heroku config:set TIMES=2
9. Open app from heroku "https://pacific-beach-17776.herokuapp.com/"
10. change uri in google dev center and fb dev center to your heroku app link.
i.e uri to https://pacific-beach-17776.herokuapp.com/
authorized redirect uri to https://pacific-beach-17776.herokuapp.com/auth/google/secrets
11. fb dev tools -> My apps -> settings -> basic change website url,
12. Facebook login -> settings -> Redirect URI i.e Valid OAuth Redirect URIs.
13. Give Privacy Policy URL and Data deletion url and make app in live mode.
