import asyncio
import os
import subprocess
import time
import json
from pprint import pformat as pf
from pprint import pprint as pp
from random import randint
import datetime
import pytz

from quart import Quart, redirect, render_template, request, send_file, url_for, websocket
from redis import Redis
from rq import Connection, Queue, Worker
from rq.job import Job

from webcutter2.dcut import CutterInterface #, report_success, report_failure
from webcutter2.dplex import PlexInterface

fileserver = '192.168.15.10'
baseurl = 'http://192.168.15.10:32400'
token = '7YgcyPLqGVM-PVxq2QVo'

plex = PlexInterface(baseurl,token)
cutter = CutterInterface(fileserver)

def report_success(job, connection, result, *args, **kwargs):
    print(f"\n{job} returned: {result}\n")

def report_failure(job, connection, type, value, traceback):
    print('got an error', type, value)

redis_connection = Redis(host='localhost',port=6379,password='63nTa6UlGeRipER5HIlInTH5hoS3ckL4', db=0)
q = Queue('QuartCutter', connection=redis_connection, default_timeout=600)

app= Quart(__name__)

initial_section = plex.sections[0]
initial_movie_key = 0
initial_movie = initial_section.recentlyAdded()[initial_movie_key]

global selection
selection = { 
    'sections' : [s for s in plex.sections if s.type == 'movie'],
    'section' : initial_section,
    'movies' : initial_section.recentlyAdded(),
    'movie' : initial_movie,
    'pos_time' : '00:00:00'
    }

# uncomment to disable caching
# @app.after_request
# async def add_header(response):
#     """
#     Add headers to both force latest IE rendering engine or Chrome Frame,
#     and also to cache the rendered page for x minutes.
#     """
#     response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
#     response.headers['Cache-Control'] = 'public, max-age=0'
#     return response

# @app.websocket('/ws')
# async def ws():
#     while True:
#         data = await websocket.receive()
#         await websocket.send(f"echo {data}")

@app.route("/delay/<int:secs>")
async def do_delay(secs):
    t0 = time.time()
    job = q.enqueue_call(cutter._long_runtask, args=(secs,))
    t1 = time.time()
    return {'result': (t1-t0)}

@app.route("/selection")
async def get_selection():
    global selection
    return { 
        'sections': [s.title for s in selection['sections']], 
        'section': selection['section'].title,
        'movies': [m.title for m in selection['movies']], 
        'movie': selection['movie'].title,
        'pos_time' : selection['pos_time']    
        }

# section related stuff
async def _update_section(section_name, force=False):
    global selection
    #print(f"\n{selection['section'].title} != {section_name}, {(selection['section'].title != section_name)}") # beim ersten Aufruf kommt der Funktionsname zur??ck, nicht das Ergebnis => if clause ...
    if ((selection['section'].title != section_name) or force): 
        sec = plex.server.library.section(section_name)
        mvs = sec.recentlyAdded()
        default_movie = mvs[initial_movie_key]
        selection.update({ 'section' : sec, 'movies' : mvs, 'movie' : default_movie })
        #print(f"_update_selection if clause:\n{pf({k:v for k,v in selection.items() if k in ['section','movie','pos','frame']})}\n")
    else:
        pass
        #print(f"_update_selection else clause:\n{pf({k:v for k,v in selection.items() if k in ['section','movie','pos','frame']})}\n")
    return selection['section']    

@app.route("/update_section", methods=['POST'])
async def update_section():
    global selection
    if request.method == 'POST':
        req = await request.json
        section_name = req['section']
        await _update_section(section_name)        
        print(f"update_section: {pf(req)}")
        return redirect(url_for('index'))

@app.route("/force_update_section")
async def force_update_section():
    global selection
    await _update_section(selection['section'].title, force=True)        
    print(f"force_update_section.")
    return 'force update section'

# movie related stuff
async def _update_movie(movie_name):
    global selection
    sel_movie = selection['movies'][initial_movie_key]
    if movie_name != '':
        lmovie = [m for m in selection['movies'] if m.title == movie_name]
        if lmovie:
            sel_movie = lmovie[0]
    #print(sel_movie)
    selection['movie'] = sel_movie
    return selection['movie']

@app.route("/movie_info", methods=['POST'])
async def set_movie_get_info():
    global selection
    if request.method == 'POST':
        req = await request.json
        section_name = req['section']
        movie_name = req['movie']
        if movie_name != '':
            s = await _update_section(section_name)
            m = await _update_movie(movie_name)
            m_info = { 'movie_info': plex.movie_rec(m) }
        else:
            if section_name == '':
                s = await _update_section('Plex Recordings')
            m = await _update_movie('')
            m_info = { 'movie_info': plex.movie_rec(m) }
            #m_info = { 'movie_info': { 'duration': 0 } }
        print(f"\nmovie_info: {req} -> \n{pf(m_info)}")
        return m_info       

@app.route("/timeline", methods=['POST'])
async def timeline():
    global selection
    t0 = time.time()
    if request.method == 'POST':
        req = await request.json
        #print(pf(req))
        basename = str(req['basename'])
        pos = int(req['pos'])
        l = int(req['l'])
        r = int(req['r'])
        step = int(req['step'])
        size = req['size']
        m = selection['movie']
        target = os.path.dirname(__file__) + "/static/"+ basename
        tl = cutter.gen_timeline(m.duration // 1000, pos, l, r, step)
        #print(pf(tl))
        r = cutter.timeline(m, target , size, tl)
        print(r)
        t1 = time.time()
        print(f"total:{(t1-t0):5.2f}")
    return r   

@app.route("/frame", methods=['POST'])
async def get_frame():
    global selection
    if request.method == 'POST':
        req = await request.json
        pos_time = req['pos_time']
        movie_name = req['movie_name']
        m = await _update_movie(movie_name)
        try:
            pic_name = await cutter.aframe(m ,pos_time ,os.path.dirname(__file__) + "/static/")
            ret = { 'frame': url_for('static', filename=pic_name) }
            print(f"frame: {req} -> {ret}")
            return ret
        except subprocess.CalledProcessError as e:
            print(f"\nframe throws error:\n{str(e)}\n") 
            ret = { 'frame': url_for('static', filename='error.jpg') }
            print(f"frame: {req} -> {ret}")

@app.route("/pos")
async def get_pos():
    global selection
    return await { 'pos': selection['pos_time'] }

@app.route("/movie_cut_info")
async def get_movie_cut_info():
    global selection
    m = selection['movie']
    dmin = m.duration / 60000
    apsc = cutter._apsc(m)
    cutfile = cutter._cutfile(m)
    eta_apsc = int((0.5 if not apsc else 0) * dmin)
    eta_cut =  int(0.9 * dmin)
    eta = eta_apsc + eta_cut
    selection['eta'] = eta
    #print(f"ETA={eta}")
    return { 'movie': m.title, 'eta': eta, 'eta_cut': eta_cut, 'eta_apsc': eta_apsc, 'cutfile': cutfile, 'apsc' : apsc }

@app.route("/cut", methods=['POST'])
async def do_cut():
    global selection
    if request.method == 'POST':
        req = await request.json
        section_name = req['section']
        movie_name = req['movie_name']
        ss = req['ss']
        to = req['to']
        inplace = req['inplace']
        s = await _update_section(section_name)
        m = await _update_movie(movie_name)        
        res = f"From section '{s}', cut '{m.title}', In {ss}, Out {to}, inplace={inplace}"
        print(res)
        try:
            await asyncio.sleep(1)
            mm = plex.MovieData(m)
            res = cutter.cut(mm,ss,to,inplace)
            m.analyze()
            await asyncio.sleep(1)
            await _update_section(selection['section'].title, force=True)        
            eta_est = selection['eta']
            res += f"ETA Estimation: {eta_est}"
            return { 'result': res }
        except subprocess.CalledProcessError as e:
            print(str(e))
            return { 'result': str(e) }


async def doProgress():
    mstatus = {
        'title': '-',
        'apsc_size': 0,
        'progress': 0,
        'started': 0
    } 
    workers = Worker.all(connection=redis_connection)
    worker = workers[0] if len(workers) > 0 else None
    if worker:
        lhb = pytz.utc.localize(worker.last_heartbeat)
        lhbtz = lhb.astimezone(pytz.timezone("Europe/Vienna"))
        w = {
            #'name': worker.name,
            'state': worker.state,
            'last_heartbeat': lhbtz.strftime("%H:%M:%S"),
            #'current_job_id': worker.get_current_job_id(),
            #'failed': worker.failed_job_count
        } 
    else:
        w = {
            'status':'no worker detected'
        }
    qd = {
        'started':q.started_job_registry.count,
        #'deferred':q.deferred_job_registry.count,
        'finished':q.finished_job_registry.count,
        #'scheduled':q.scheduled_job_registry.count,
        'failed':q.failed_job_registry.count,
    }
    if q.started_job_registry.count > 0:
        qd['started_jobs'] = []
        #qd['started_jobs'] = q.started_job_registry.get_job_ids()
        for job_id in q.started_job_registry.get_job_ids():
            job = Job.fetch(job_id, connection=redis_connection)
            m = plex.MovieData(job.args[0])
            prog = cutter._movie_stats(*job.args)
            apsc_size = cutter._apsc_size(m)
            #print(cutter._movie_stats(*job.args))
            d = {
                'title': m.title,
                'ss':job.args[1],
                'to':job.args[2],
                'name': job_id,
                'status':job.get_status(refresh=True),
                'progress':prog
            }
            qd['started_jobs'].append(d)
            mstatus.update({
                'title': m.title,
                'apsc_size': apsc_size,
                'progress': prog,
                'started': q.started_job_registry.count               
            })

    if q.finished_job_registry.count > 0:
        qd['finished_jobs'] = []
        for job_id in q.finished_job_registry.get_job_ids():
            job = Job.fetch(job_id, connection=redis_connection)
            d = {
                'name': job_id,
                'result': job.result
            }
            qd['finished_jobs'].append(d) 

    return mstatus
    # return {
    #     'worker':w,
    #     'queue': qd
    #     }

@app.websocket('/wsprogress')
async def wsprogress():
    while True:
        data = await websocket.receive()
        status = {'status':'no data'}
        status = await doProgress()        
        await websocket.send(json.dumps(status))

@app.route("/progress")
async def progress():
    return await doProgress()

@app.route("/cut2", methods=['POST'])
async def do_cut2():
    global selection
    if request.method == 'POST':
        req = await request.json
        section_name = req['section']
        movie_name = req['movie_name']
        ss = req['ss']
        to = req['to']
        inplace = req['inplace']
        s = await _update_section(section_name)
        m = await _update_movie(movie_name)        
        res = f"Queue Cut From section '{s}', cut '{m.title}', In {ss}, Out {to}, inplace={inplace}"
        print(res)
        try:
            mm = plex.MovieData(m)
            #cutter.prepare_progress(mm, inplace)
            job = q.enqueue_call(cutter.cut, args=(mm,ss,to,inplace,))
            #, on_success=report_success, on_failure=report_failure)
            res = f"""
Section:        {s.title}
Duration Raw:   {mm.duration // 60000}
Duration Cut:   {cutter.cutlength(ss,to)}
In:             {ss}
Out:            {to}
Inplace:        {inplace}
.ap .sc Files:  {cutter._apsc(m)}
cut File:       {cutter._cutfile(m)}

now  queued for cutting.            
"""
            return { 'result': res}
        except subprocess.CalledProcessError as e:
            print(str(e))
            return { 'result': str(e) }

@app.route("/")
async def index():
    global selection
    host = request.headers.get('Host')
    return await render_template('webcutter/index2.html', host=host)

@app.route("/apple-touch-icon.png")
async def get_icon():
    return await send_file('static/apple-touch-icon.png', mimetype='image/png')

@app.route("/test")
async def test():
    return await render_template('test.html')

@app.route("/testmodal")
async def testmodal():
    return await render_template('testmodal.html')

if __name__ == '__main__':
    print('''
\033[H\033[J
************************************************
* Quart WebCutter V0.01 (c)2022 Dieter Chvatal *
* Async Backend for Webcutter                  *
************************************************
''')
    #app.run(use_reloader=True, host='0.0.0.0', port=5100, debug=True, threaded=False)
    try:
        asyncio.run(app.run_task(use_reloader=True, host='0.0.0.0', port=5100, debug=True))
    finally:
        try:
            cutter.umount()
        except Exception:
            pass
