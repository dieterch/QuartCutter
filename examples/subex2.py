import subprocess

p = subprocess.Popen(['wc'],
    stdin = subprocess.PIPE,
    stdout= subprocess.PIPE)

p.stdin.write(b'hello world\nthis is a test\n')
p.stdin.close()

out = p.stdout.read()
print(out)
