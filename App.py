import asyncio
from quart import Quart, request, redirect, url_for, render_template, send_file
from webcutter2.dplex import PlexInterface
from webcutter2.dcut import CutterInterface
import os
import time
import subprocess
from pprint import pprint as pp
from pprint import pformat as pf

fileserver = '192.168.15.10'
baseurl = 'http://192.168.15.10:32400'
token = '7YgcyPLqGVM-PVxq2QVo'

plex = PlexInterface(baseurl,token)
cutter = CutterInterface(fileserver)

app= Quart(__name__)

initial_section = plex.sections[0]
initial_movie_key = 5
initial_movie = initial_section.recentlyAdded()[initial_movie_key]

global selection
selection = { 
    'sections' : [s for s in plex.sections if s.type == 'movie'],
    'section' : initial_section,
    'movies' : initial_section.recentlyAdded(),
    'movie' : initial_movie,
    'pos_time' : '00:00:00'
    #'frame'  : 'frame.jpg'
    #'eta' : 0 
    }


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
    #print(f"\n{selection['section'].title} != {section_name}, {(selection['section'].title != section_name)}") # beim ersten Aufruf kommt der Funktionsname zurück, nicht das Ergebnis => if clause ...
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

# @app.route("/sections")
# async def get_sections():
#     global selection
#     return { 'sections': [s.title for s in selection['sections']], 'section': selection['section'].title }

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

# @app.route("/movies")
# async def get_movies():
#     global selection
#     return { 'movies': [m.title for m in selection['movies']], 'movie': selection['movie'].title }

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
        pos = int(req['pos'])
        l = int(req['l'])
        r = int(req['r'])
        step = int(req['step'])
        size = req['size']
        tl = cutter.gen_timeline(cutter.pos2str(pos), l, r, step)
        m = selection['movie']
        target = 'test.gif'
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
    eta_cut =  int(0.7 * dmin)
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
            res = cutter.cut(m,ss,to,inplace)
            m.analyze()
            #time.sleep(10)
            eta_est = selection['eta']
            res += f"ETA Estimation: {eta_est}"
            return { 'result': res }
        except subprocess.CalledProcessError as e:
            print(str(e))
            return { 'result': str(e) }


@app.route("/")
async def index():
    global selection
    host = request.headers.get('Host')
    return await render_template('webcutter/index.html', host=host)

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
    #app.run(use_reloader=True, host='0.0.0.0', port=5000, debug=True, threaded=False)
    try:
        asyncio.run(app.run_task(use_reloader=True, host='0.0.0.0', port=5100, debug=True))
    finally:
        try:
            cutter.umount()
        except Exception:
            pass
