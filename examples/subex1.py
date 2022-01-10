import subprocess

def ffpicture(movie, ss, pfile):
    sx = f"ffmpeg -ss {ss} -i inp -hide_banner -vframes 1 -q:v 2 {pfile} -loglevel quiet -y"
    lexc = sx.split(' ')
    lexc[4] = movie
    try:
        out = subprocess.check_output(lexc)
        return out.decode('utf-8')
    except subprocess.CalledProcessError as e:
        return 'FFMEG Call failed:' + str(e)

for i,s in enumerate(['0:29:30','0:29:40','0:29:50','0:30:00','0:30:10','0:30:20','0:30:30']):
    ffpicture('Das Appartement (1960).ts', s, 'start' + str(i) + '.png')

for i,s in enumerate(['0:59:30','0:59:40','0:59:50','1:00:00','1:00:10','1:00:20','1:00:30']):
    ffpicture('Das Appartement (1960).ts', s, 'end' + str(i) + '.png')