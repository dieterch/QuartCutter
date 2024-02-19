import re

while True:
    choice = input('choice: ')
    if re.search("^[p]+",choice):
        print(choice)
    else:
        print('not matching')
