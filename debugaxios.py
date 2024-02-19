import asyncio
from quart import Quart, request, render_template
#from flask_cors import CORS

app = Quart(__name__)
#CORS(app)

@app.route("/")
async def hello():
    return await render_template('hello.html')

@app.route("/endpoint/", methods=['GET','POST'])
async def endpoint():
    if request.method == 'POST':
        return f"<p>POST Request with body {await request.json} received!</p>"
        #return f"<p>POST Request received!</p>"
    else:
        return "<p>GET Request received!</P>"

@app.route("/frame/", methods=['POST'])
async def frame():
    if request.method == 'POST':
        req = await request.json
        pos_time = req['pos_time']
        movie_name = req['movie_name']
        return f"<p>POST Request with body {req} received!</p>"

if __name__ == "__main__":
    asyncio.run(app.run_task(host='0.0.0.0', port=5200, debug=True))