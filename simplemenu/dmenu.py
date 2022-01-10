import re 

clear = lambda: print("\033[H\033[J", end="")
ct = lambda t: f"{int(t // 60):02d}:{int(t % 60):02d}:{int((t-int(t)) * 60):02d}"

class Repeat(Exception):
    pass

class CutterMenu:
    def __init__(self, commandstext, header='', client = None):
        self._commandstext = commandstext
        self._header = header
        self._pos = 15
        self._message = None
        self.t0 = None
        self.t1 = None
        self.client = client

    def choice(self):
        self.header = self._header + f"\n- pos = {ct(self._pos)}"
        while True:
            if self.client != None:
                try:
                    self.client.seekTo(self._pos * 60000, mtype='video', timeout=1)
                except Exception:
                    pass
            clear()
            print(self.header + '\n')
            if self._message:
                print(self._message)

            prompt = self._commandstext + " (press 'q' to quit): "
            choice = input(prompt)
            if choice == 'q':
                raise SystemExit
            elif choice == 'cut':
                if self.t0 == None or self.t1 == None:
                    self._message = f"please define t0 and t1 first!"
                else:
                    return (self.t0, self.t1)
            elif choice == 'r':
                raise Repeat
            elif choice == 't0':
                self.t0 = ct(self._pos)
                self.header = self._header = self._header + f"\n- t0  = {self.t0}"
            elif choice == 't1':
                self.t1 = ct(self._pos)
                self.header = self._header = self._header + f"\n- t1  = {self.t1}"
            elif re.search("^([0-9]+([.][0-9]*)?|[.][0-9]+)$", choice):
                self._pos = float(choice)
                self.header = self._header + f"\n- pos = {ct(self._pos)}"
            elif re.search("^[r][s][+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$", choice):
                self._pos += float(choice[2:]) / 60
                self.header = self._header + f"\n- pos = {ct(self._pos)}"
            elif re.search("^[r][m][+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$", choice):
                self._pos += float(choice[2:])
                self.header = self._header + f"\n- pos = {ct(self._pos)}"
            elif re.search("^[r][h][+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$", choice):
                self._pos += float(choice[2:]) * 60
                self.header = self._header + f"\n- pos = {ct(self._pos)}"
            
class Menu:
    def __init__(self, choices, choicetext, header='', scrollby = 10):
        self._scrollby = scrollby
        self._choices = choices
        self._setpage(0)
        self._choicetext = choicetext
        self._header = header

    # def selection(self, func):
    #     if (ch:= self.choice()) != None:
    #         return func(ch)

    def _menu(self):
        #print(f"page vorher: {self._page}")
        if self._page >= len(self._choices) // self._scrollby:
            self._page = len(self._choices) // self._scrollby
        if self._page < 0:
            self._page = 0
        #print(f"page nachher: {self._page}")
        self._list_choices = self._choices[self._page * self._scrollby:(self._page + 1) * self._scrollby]
        return self._list_choices

    def _move_page(self, x):
        self._page += x
        return self._menu()

    def _setpage(self, p):
        self._page = p
        return self._menu()

    def _paginate(self, choice):
            ret = True
            if choice == 'q':
                raise SystemExit
            elif choice == 'f':
                self._setpage(0)
            elif re.search("^[p]+",choice):
                self._move_page(-self._scrollby**(len(choice)-1))
            elif re.search("^[n]+",choice):
                self._move_page(self._scrollby**(len(choice)-1))
            elif choice == 'l':
                self._setpage(len(self._choices) // self._scrollby)
            elif choice == 'r':
                raise Repeat
            else:
                return False
            return ret

    def choice(self):
        while True:
            clear()
            print(self._header + '\n')
            for i,s in enumerate(self._list_choices):
                print(f"{(self._page * self._scrollby + i + 1):>3d} {s}")
            
            print()

            if len(self._choices) > self._scrollby:
                prompt = self._choicetext + " (press 'q' to quit, 'n' for next and 'p' for previous page): "
            else:
                prompt = self._choicetext + " (press 'q' to quit): "

            choice = input(prompt)
            if self._paginate(choice):
                continue
            try:
                c = int(choice)-1 if choice.isnumeric() else -1
                if (c < 0) or (c >= len(self._choices)) :
                    raise IndexError("list index out of range")
                return int(c)
            except IndexError as err:
                print(str(err))

        