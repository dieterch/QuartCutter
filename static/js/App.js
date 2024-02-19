    // Globale Funktionen
    console.log(Vue.prototype.$host)
    let myModalSlot = new VueModalSlot()

    if (navigator.clipboard) {
        console.log('Clipboard API available.')
    }

    const vueApp = new Vue({
        el: '#vueApp',
        data: {
            sections: [],
            section: '',
            section_type: 'movie',
            movies: [],
            seasons: [],
            season: '',
            series: [],
            serie: '',
            lmovie: '',
            lmovie_dummy:0,
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
            },
            mydata: {
                title: '-',
                apsc_size: 0,
                started: 0,
                progress: 0
            },
            mydata_timer_id: 0
        },
        computed: {
            totalsections() {
                return this.sections.length
            },
            totalmovies() {
                return this.movies.length
            },
            totalseasons() {
                return this.seasons.length
            },
            totalseries() {
                return this.series.length
            },
            movie: {
                get() {
                    this.reset_t0_t1()
                    this.lpos = 0
                    this.lmovie_dummy = this.lmovie_dummy
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
                // <i class="bi-alarm" style="color: black;"></i>
                return [
                    {name:"",icon: '<i class="bi bi-align-start dbox-iconstyle"></i>', val:0, type:"abs", class:"btn btn-primary btn-sm sb_btn"},
                    {name:" 15'", icon: '<i class="bi bi-align-start dbox-iconstyle"></i>', val:15*60, type:"abs", class:"btn btn-primary btn-sm sb_btn"},
                    {name:" 30'", icon: '<i class="bi bi-arrow-bar-left dbox-iconstyle" style="color: black;"></i>', val:-1800, type:"rel", class:"btn btn-info btn-sm sb_btn"},
                    {name:" 10'", icon: '<i class="bi bi-arrow-bar-left dbox-iconstyle" style="color: black;"></i>', val:-600, type:"rel", class:"btn btn-info btn-sm sb_btn"},
                    {name:" 5'", icon: '<i class="bi bi-arrow-bar-left dbox-iconstyle" style="color: black;"></i>', val:-5*60, type:"rel", class:"btn btn-info btn-sm sb_btn"},
                    {name:" 1'", icon: '<i class="bi bi-arrow-bar-left dbox-iconstyle" style="color: black;"></i>', val:-60, type:"rel", class:"btn btn-info btn-sm sb_btn"},
                    {name:' 10"', icon: '<i class="bi bi-arrow-bar-left dbox-iconstyle" style="color: white;"></i>', val:-10, type:"rel", class:"btn btn-secondary btn-sm sb_btn"},
                    {name:' 5"', icon: '<i class="bi bi-arrow-bar-left dbox-iconstyle" style="color: white;"></i>', val:-5, type:"rel", class:"btn btn-secondary btn-sm sb_btn"},
                    {name:' 1"', icon: '<i class="bi bi-arrow-bar-left dbox-iconstyle" style="color: white;"></i>', val:-1, type:"rel", class:"btn btn-secondary btn-sm sb_btn"},
                ]
            },
            bright() {
                return [
                    {name:'1" ', icon: '<i class="bi bi-arrow-bar-right dbox-iconstyle" style="color: white;"></i>', val:1, type:"rel", class:"btn btn-secondary btn-sm sb_btn"},
                    {name:'5" ', icon: '<i class="bi bi-arrow-bar-right dbox-iconstyle" style="color: white;"></i>', val:5, type:"rel", class:"btn btn-secondary btn-sm sb_btn"},                    
                    {name:'10" ', icon: '<i class="bi bi-arrow-bar-right dbox-iconstyle" style="color: white;"></i>', val:10, type:"rel", class:"btn btn-secondary btn-sm sb_btn"},                    
                    {name:"1' ", icon: '<i class="bi bi-arrow-bar-right dbox-iconstyle" style="color: black;"></i>', val:60, type:"rel", class:"btn btn-info btn-sm sb_btn"},
                    {name:"5' ", icon: '<i class="bi bi-arrow-bar-right dbox-iconstyle" style="color: black;"></i>', val:5*60, type:"rel", class:"btn btn-info btn-sm sb_btn"},
                    {name:"10' ", icon: '<i class="bi bi-arrow-bar-right dbox-iconstyle" style="color: black;"></i>', val:600, type:"rel", class:"btn btn-info btn-sm sb_btn"},
                    {name:"30' ", icon: '<i class="bi bi-arrow-bar-right dbox-iconstyle" style="color: black;"></i>', val:1800, type:"rel", class:"btn btn-info btn-sm sb_btn"},
                    {name:"15' ",icon: '<i class="bi bi-align-end dbox-iconstyle"></i>', val:this.pos_from_end(15*60), type:"abs", class:"btn btn-primary btn-sm sb_btn"},
                    {name:"",icon: '<i class="bi bi-align-end dbox-iconstyle"></i>', val:this.pos_from_end(0), type:"abs", class:"btn btn-primary btn-sm sb_btn"},
                ]
            }
        },
        methods: {
            //lmd() {
                //this.lmovie_dummy += 1
                //ws.send('bob ' + String(this.lmovie_dummy))
                //myRQStatus.sendMessage('bob')
                // wsp.send({foo: 'bar'})
                // Request({foo: 'bar'})
                //     .then(response => {
                //         console.log('reponse: ' +  response.data)
                //     })
                //     .catch(error => {
                //         console.log('error: ' + error)
                //     })
            //},
            // streamURL() {
            //     axios.get(`${Vue.prototype.$host}/streamurl.xspf${'?'+String(Math.random())}`)
            //         .then(response => {
            //             console.log(response.data);
            //         })
            //         .catch(error => {
            //             console.log('error: ' + error); 
            //         })
            // },
            analyze() {
                return axios.post(`${Vue.prototype.$host}/analyze`,
                    { 
                        "movie": this.lmovie
                    },
                    { 
                        headers: { 'Content-type': 'application/json', }
                    }).then((response) => {
                            console.log('analyze: ' + response.data);
                    }).catch( error => { 
                            console.log('error: ' + error); 
                    });
                },
            rqstatus_visible() {
                return this.mydata.started > 0
            },
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
                        "section": this.section
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
                update_serie() {
                    return axios.post(`${Vue.prototype.$host}/update_serie`,
                        { 
                            "serie": this.serie
                        },
                        { 
                            headers: { 'Content-type': 'application/json', }
                        }).then((response) => {
                                console.log('serie: ' + this.serie);
                                this.load_selection();
                        }).catch( error => { 
                                console.log('error: ' + error); 
                        });
                    },    
                update_season() {
                return axios.post(`${Vue.prototype.$host}/update_season`,
                    { 
                        "season": this.season
                    },
                    { 
                        headers: { 'Content-type': 'application/json', }
                    }).then((response) => {
                            console.log('season: ' + this.season);
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
                    console.log('in created', response.data)
                    this.sections = response.data.sections;
                    this.section = response.data.section;
                    this.section_type = response.data.section_type;
                    this.movies = response.data.movies;
                    this.movie = response.data.movie;
                    this.seasons = response.data.seasons;
                    this.season = response.data.season;
                    this.series = response.data.series;
                    this.serie = response.data.serie;
                    this.pos = str2pos(response.data.pos_time)
                    //this.loadmovies()
                }).catch( error => { 
                    console.log('error: ' + error); 
                });
            },
            // load_movie_info_promise() {
            //     return axios.post(`${Vue.prototype.$host}/movie_info`,
            //         { 
            //             "section": this.section,
            //             "movie": this.lmovie
            //         },
            //         { headers: {
            //         'Content-type': 'application/json',
            //         }
            //     })
            // },
            load_movie_info_promise() {
                console.log(`${Vue.prototype.$host}/movie_info`, 
                    this.section, 
                    this.lmovie
                )
                return axios({
                    method: 'post',
                    url: `${Vue.prototype.$host}/movie_info`,
                    //url: "/movie_info/",
                    data: { 
                        section: this.section,
                        movie: this.lmovie
                    },
                    headers: {
                        'Content-type': 'application/json',
                    }
                })
            },
            pos2fname(pos) {
                if (pos === -999) {
                    return '/static/spinner_160x90.gif'
                } else if (pos === -998) {
                    return '/static/background.png'
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
                            "basename": this.ltimeline.basename,
                            "pos": mypos,
                            "l": this.ltimeline.l,
                            "r": this.ltimeline.r,
                            "step": this.ltimeline.step,
                            "size": this.ltimeline.size
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
                        "pos_time": pos,
                        "movie_name": this.lmovie
                    },
                    { headers: {
                    'Content-type': 'application/json',
                    }
                })
            },
            // get_frame_promise(pos) {
            //     return axios({
            //         method: 'post',
            //         url: `${Vue.prototype.$host}/frame`,
            //         data: { 
            //             pos_time: pos,
            //             movie_name: this.lmovie
            //         },
            //         headers: {
            //             'Content-type': 'application/json',
            //         }
            //     })
            // },
            docut2() {
                this.show_close_button = false
                this.movie_cut_info_promise()
                .then(response => {
                    this.lmovie_cut_info = response.data;
                    //console.log("in movie_cut_info", this.lmovie_cut_info)
                    msg = 
`
Cut2:
                
section: '${this.section}'
movie: '${this.lmovie}'
In: ${this.t0}
Out: ${this.t1}
Inplace: ${this.inplace}
.ap .sc Files ?: ${this.lmovie_cut_info.apsc}
_cut File ?: ${this.lmovie_cut_info.cutfile}
`
                    console.log(msg)
                        this.result_available = false
                        this.eta_counter = 0
                        myModalSlot.show()
                        this.eta_counter_id = setInterval(function myTimer() { this.eta_counter += 1 }.bind(this), 1000);
                        console.log(this.lmovie_cut_info)
                        return axios.post(`${Vue.prototype.$host}/cut2`,
                            {   
                                "section": this.section, 
                                "movie_name": this.lmovie,
                                "ss": this.t0,
                                "to": this.t1,
                                "inplace": this.inplace,
                                "etaest": this.lmovie_cut_info.eta
                            },
                            { headers: { 'Content-type': 'application/json',}}
                        ).then((response) => {
                            clearInterval(this.eta_counter_id)
                            this.mydata.title = ' ... '
                            this.apsc_size = 0
                            this.mydata.progress = 0
                            this.mydata.started = 1
                            this.mydata_timer_id = setInterval(function mdTimer() {
                                axios.get(`${Vue.prototype.$host}/progress`)
                                .then(response => {
                                    this.mydata = response.data
                                    console.log(this.mydata)
                                    if (this.mydata.started == 0) {
                                        this.mydata.started = 0 
                                        clearInterval(this.mydata_timer_id)
                                    }
                                })
                                .catch(error => { 
                                    console.log('error: ' + error);
                                    clearInterval(this.mydata_timer_id) 
                                })
                            }.bind(this), 10000);

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