    // Globale Funktionen
    console.log(Vue.prototype.$host)
    const zeroPad = (num, places) => String(num).padStart(places, '0')
    const pos2str = (pos) => {
        pos = (pos >= 0) ? pos : 0 
        return `${zeroPad(Math.trunc(pos / 3600),2)}:${zeroPad(Math.trunc((pos % 3600) / 60),2)}:${zeroPad(Math.trunc(pos % 60,2),2)}`
    }
    const str2pos = (st) => {
        erg = parseInt(String(st).slice(0,2))*3600 + parseInt(String(st).slice(3,5))*60 + parseInt(String(st).slice(-2))
        return erg
    }

    let myModalSlot = new VueModalSlot()

    // Vue App
    const vueApp = new Vue({
        el: '#vueApp',
        data: {
            sections: [],
            section: '',
            movies: [],
            lmovie: '',
            lmovie_info: Object(),
            lmovie_cut_info: { 
                    apsc: false,
                    cutfile: false,
                    eta: 0,
                    eta_cut:0,
                    eta_apsc: 0
                },
            eta_counter: 0,
            eta_counter_id: 0,
            lpos: 0,
            t0: "00:00:00",
            t0_valid: false,
            t1: "01:00:00",
            t1_valid: false,
            inplace: false,            
            frame_name: '',
            result_available: false,
            result:'',
            show_close_button: false,
            toggle_timeline: false,
            ltimeline: {
                basename: 'frame.gif',
                larray: [],
                l: -4,
                r: 4,
                step: 1,
                size: '160'
            }
        },
        computed: {
            totalsections() {
                return this.sections.length
            },
            totalmovies() {
                return this.movies.length
            },
            movie: {
                get() {
                    this.reset_t0_t1()
                    this.lpos = 0
                    this.load_movie_info_promise()
                    .then(response => {
                        this.lmovie_info = response.data.movie_info
                        this.toggle_timeline = false                        
                    })
                    .catch( error => { 
                        console.log('error: ' + error); 
                    });
                    return this.lmovie
                },
                set(val) {
                    //console.log('in movie setter')
                    this.lmovie = val
                }
            },
            cut_ok() {
                return this.t0_valid & this.t1_valid & ( this.ltimeline.step == 1 )
            },         
            duration_cut() {
                    //console.log(`t1pos=${str2pos(this.t1)} t0pos=${str2pos(this.t0)}`)
                    return Math.floor((str2pos(this.t1) - str2pos(this.t0)) / 60 ) 
            },
            pos: {
                get() {
                    //console.log("pos getter ", this.lpos)
                    ret = pos2str(this.lpos)
                    this.get_frame_promise(ret)
                        .then((response) => {
                            this.frame_name = response.data.frame + '?' + String(Math.random())
                        }).catch( error => { 
                            console.log('error: ' + error); 
                        });
                    return ret 
                },
                set(newValue) {
                    this.lpos = str2pos(newValue)
                }
            },
            bleft() {
                return [
                    {name:"S15'", val:15*60, type:"abs", class:"btn btn-outline-primary btn-sm col mt-0 me-1"},
                    {name:"-30'", val:-1800, type:"rel", class:"btn btn-outline-info btn-sm col mt-0 me-1"},
                    {name:"-10'", val:-600, type:"rel", class:"btn btn-outline-info btn-sm col mt-0 me-1"},
                    {name:"-5'", val:-5*60, type:"rel", class:"btn btn-outline-info btn-sm col mt-0 me-1"},
                    {name:"-1'", val:-60, type:"rel", class:"btn btn-outline-info btn-sm col mt-0 me-1"},
                    {name:'-10"', val:-10, type:"rel", class:"btn btn-outline-secondary btn-sm col mt-0 me-1"},
                    {name:'-5"', val:-5, type:"rel", class:"btn btn-outline-secondary btn-sm col mt-0 me-1"},
                    {name:'-1"', val:-1, type:"rel", class:"btn btn-outline-secondary btn-sm col mt-0 me-1"},
                ]
            },
            bright() {
                return [
                    {name:'+1"', val:1, type:"rel", class:"btn btn-outline-secondary btn-sm col mt-0 ms-1"},
                    {name:'+5"', val:5, type:"rel", class:"btn btn-outline-secondary btn-sm col mt-0 ms-1"},                    
                    {name:'+10"', val:10, type:"rel", class:"btn btn-outline-secondary btn-sm col mt-0 ms-1"},                    
                    {name:"+1'", val:60, type:"rel", class:"btn btn-outline-info btn-sm col mt-0 ms-1"},
                    {name:"+5'", val:5*60, type:"rel", class:"btn btn-outline-info btn-sm col mt-0 ms-1"},
                    {name:"+10'", val:600, type:"rel", class:"btn btn-outline-info btn-sm col mt-0 ms-1"},
                    {name:"+30'", val:1800, type:"rel", class:"btn btn-outline-info btn-sm col mt-0 ms-1"},
                    {name:"E15'", val:this.pos_from_end(15*60), type:"abs", class:"btn btn-outline-primary btn-sm col mt-0 ms-1"},
                ]
            }
        },
        methods: {
            test() {
                this.show_close_button = true
                this.result_available = false
                this.movie_cut_info_promise()
                .then(response => {
                    this.lmovie_cut_info = response.data;
                    myModalSlot.show()
                }).catch( error => { 
                    console.log('error: ' + error); 
                });
            },
            toggle_inplace() {
                this.inplace = !this.inplace
            },
            update_section() {
                return axios.post(`${Vue.prototype.$host}/update_section`,
                    { 
                        section: this.section
                    },
                    { 
                        headers: { 'Content-type': 'application/json', }
                    }).then((response) => {
                            //console.log('section: ' + this.section);
                            this.load_selection();
                    }).catch( error => { 
                            console.log('error: ' + error); 
                    });
                },
            load_selection() {
                axios
                //.get(`${Vue.prototype.$host}/sections`)
                .get(`${Vue.prototype.$host}/selection`)
                .then(response => {
                    //console.log('in created', response.data)
                    this.sections = response.data.sections;
                    this.section = response.data.section;
                    this.movies = response.data.movies;
                    this.movie = response.data.movie;
                    this.pos = str2pos(response.data.pos_time)
                    //this.loadmovies()
                }).catch( error => { 
                    console.log('error: ' + error); 
                });
            },
            load_movie_info_promise() {
                return axios.post(`${Vue.prototype.$host}/movie_info`,
                    { 
                        section: this.section,
                        movie: this.lmovie
                    },
                    { headers: {
                    'Content-type': 'application/json',
                    }
                })
            },
            pos2fname(pos) {
                if (pos === -999) {
                    return '/static/spinner_160x90.gif'
                } else if (pos === -998) {
                    return '/static/white.png'
                } else  {
                    return  '/static/' + this.ltimeline.basename.slice(0,-4) + '_' + pos2str(pos) + this.ltimeline.basename.slice(-4) + '?' + String(Math.random())
                }
            },
            pos_from_end(dsec) {
                val = Math.trunc(this.lmovie_info.duration_ms / 1000 - dsec) 
                val = (val < 0) ? 0 : val
                return val
            },
            tostart() {
                this.lpos = 0
                this.timeline(this.lpos)                
            },
            toend() {
                this.lpos = this.pos_from_end(0)             
                this.timeline(this.lpos)                
            },
            page_minus_timeline() {
                if (this.lpos + ((this.ltimeline.l - this.ltimeline.r) * this.ltimeline.step)> 0) {
                    this.lpos += (this.ltimeline.l - this.ltimeline.r) * this.ltimeline.step
                    this.lpos = this.posvalid(this.lpos)                
                } else this.lpos = 0
                this.timeline(this.lpos)
            },
            page_plus_timeline() {
                //console.log('in ">":',this.lpos, this.pos_from_end(0), this.lpos + (this.ltimeline.r - this.ltimeline.l) * this.ltimeline.step)
                if (this.lpos + ((this.ltimeline.r - this.ltimeline.l) * this.ltimeline.step ) < this.pos_from_end(0)) {
                    this.lpos += (this.ltimeline.r - this.ltimeline.l) * this.ltimeline.step
                    //console.log('in ">, if ... nach +=":',this.lpos)
                    this.lpos = this.posvalid(this.lpos)
                    //console.log('in ">, if ... nach this.posvalid":',this.lpos)
                } else this.lpos = this.pos_from_end(0)
                this.timeline(this.lpos)
            },
            toggle_and_timeline(mypos) {
                this.toggle_timeline = !this.toggle_timeline
                this.lpos = this.posvalid(this.lpos)
                this.timeline(mypos)
            },
            posvalid(val) {
                val = (val >=0 ) ? val : -998 //0
                val = (val <= this.pos_from_end(0)) ? val : -998 //this.pos_from_end(0)
                return val
            },
            timeline(mypos) {
                if (this.toggle_timeline) {
                    this.ltimeline.larray.length = 0
                    for (p=this.ltimeline.l;p <=this.ltimeline.r;p+=1) {
                        this.ltimeline.larray.push(-999)
                    }
                    sarray = []
                    axios.post(`${Vue.prototype.$host}/timeline`,
                        { 
                            basename: this.ltimeline.basename,
                            pos: mypos,
                            l: this.ltimeline.l,
                            r: this.ltimeline.r,
                            step: this.ltimeline.step,
                            size: this.ltimeline.size
                        },
                        { headers: {
                        'Content-type': 'application/json',
                        }
                    })
                    .then(response => {
                        // console.log('promise timeline resolved', response.data)
                        this.ltimeline.larray.length = 0
                        for (p=this.ltimeline.l;p <=this.ltimeline.r;p+=1) {
                            val = mypos + p*Math.abs(this.ltimeline.step)
                            val = this.posvalid(val)
                            this.ltimeline.larray.push(val)
                            //sarray.push(this.pos2fname(val))
                        }
                        //console.log(this.ltimeline.larray)
                        //console.log(sarray)
                    }).catch( error => { 
                        console.log('error: ' + error); 
                    });
                }
            },
            movie_cut_info_promise() {
                return axios.get(`${Vue.prototype.$host}/movie_cut_info`)
            },
            reset_t0_t1() {
                this.t0 = "00:00:00"
                this.t0_valid = false 
                this.t1 = "01:00:00"
                this.t1_valid = false                 
            },
            set_timeline_step(step) {
                this.ltimeline.step = step
                this.lpos = Math.trunc(this.lpos / step) * step
            },
            hpos(b) {
                // this.toggle_timeline = false 
                if (b.type == "rel") {
                    this.set_timeline_step(Math.abs(b.val))
                    if (!this.toggle_timeline) {
                        this.lpos += b.val
                        this.lpos = this.posvalid(this.lpos)
                        // console.log(this.lpos)
                    }
                    this.timeline(this.lpos)                
                } else if (b.type == "abs") {
                    this.lpos = b.val
                    this.timeline(this.lpos)                 
                } else if (b.type == "t0")  {
                    this.t0 = this.pos
                    this.t0_valid = true 
                }else if (b.type == "t1")  {
                    this.t1 = this.pos
                    this.t1_valid = true 
                } else {
                    alert("unknown type in hpos")
                }

            },
            get_frame_promise(pos) {
                //console.log(`in load frame ... request ${pos}`)
                return axios.post(`${Vue.prototype.$host}/frame`,
                    { 
                        pos_time: pos,
                        movie_name: this.lmovie
                    },
                    { headers: {
                    'Content-type': 'application/json',
                    }
                })
            },            
            docut() {
                this.show_close_button = false
                this.movie_cut_info_promise()
                .then(response => {
                    this.lmovie_cut_info = response.data;
                    //console.log("in movie_cut_info", this.lmovie_cut_info)
                    msg = 
`
Cut:
                
section: '${this.section}'
movie: '${this.lmovie}'
In: ${this.t0}
Out: ${this.t1}
Inplace: ${this.inplace}
.ap .sc Files?: ${this.lmovie_cut_info.apsc}
_cut File ?: ${this.lmovie_cut_info.cutfile}
`
                    console.log(msg)
                        this.result_available = false
                        this.eta_counter = 0
                        myModalSlot.show()
                        this.eta_counter_id = setInterval(function myTimer() { this.eta_counter += 1 }.bind(this), 1000);
                        console.log(this.lmovie_cut_info)
                        return axios.post(`${Vue.prototype.$host}/cut`,
                            {   
                                section: this.section, 
                                movie_name: this.lmovie,
                                ss: this.t0,
                                to: this.t1,
                                inplace: this.inplace,
                                etaest: this.lmovie_cut_info.eta
                            },
                            { headers: { 'Content-type': 'application/json',}}
                        ).then((response) => {
                            clearInterval(this.eta_counter_id)
                            this.toggle_timeline = false
                            this.load_movie_info_promise()
                            .then(response => {
                                this.lmovie_info = response.data.movie_info
                                this.toggle_timeline = false                        
                            })
                            .catch( error => { 
                                console.log('error: ' + error); 
                            });
                            this.result = response.data.result
                            this.result_available = true
                        }).catch( error => { 
                            console.log('error: ' + error); 
                        });
                    }).catch( error => { 
                            console.log('error: ' + error); 
                    });
                }
            },
            created() {
                this.load_selection()
            },
            delimiters: ['[[',']]']
        })