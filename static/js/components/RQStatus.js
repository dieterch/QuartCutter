class VueRQStatus {
    constructor() {
        this.component = Vue.component(
            'rqstatus', {
                props: ['text'],
                data: function() {
                    return {
                      connection: null,
                      resp: '',
                      counter: 0,
                      counter_id: 0,
                      mydata: {
                          title: '-',
                          started: 0,
                          progress: 0
                      }
                    }
                  },
                // [[ mydata.queue.started_jobs[0].title ]] [[ mydata.queue.started_jobs[0].status ]] [[ mydata.queue.started_jobs[0].progress ]]
                // template: `
                // <div id="rqstatus">
                //     <button v-on:click="start()">Start</button>
                //     <button v-on:click="stop()">Stop</button> [[ counter ]] 
                //     <pre v-if="visible()">[[ resp ]]</pre>
                // </div>`,
                template: `
                <div id="rqstatus">
                    <span v-if="visible()">cutting: [[ mydata.title ]] [[ mydata.progress]]%</span>
                    <span v-else>cutting: -</span>
                </div>`,
                methods: {
                    start: function() {
                        console.log('Status Updates started.')
                        this.counter_id = setInterval(function myTimer() { 
                            this.counter += 1
                            //console.log(this.counter)
                            this.connection.send('go')
                        }.bind(this), 10000);
                    },
                    stop: function() {
                        console.log("Status Updates stopped. ", this.counter_id)
                        clearInterval(this.counter_id)
                        this.reps = ''
                        this.mydata.title = '-'
                        this.mydata.progress = 0
                        this.started = 0
                        this.counter = 0
                    },
                    visible() {
                        return this.mydata.started > 0
                    }
                  },
                created: function() {
                    console.log("Starting connection to Progress WebSocket Server")
                    this.connection = new WebSocket(`${Vue.prototype.$ws}/wsprogress`)

                    this.connection.onmessage = function (event) {
                        this.open = true
                        this.mydata = JSON.parse(event.data)
                        // this.resp = JSON.stringify(this.mydata, null, 2)
                        // console.log(this.resp)
                    }.bind(this)
                
                    this.connection.onopen = function(event) {
                        console.log(event)
                        console.log("Successfully connected to the Progress Websocket server")
                        this.start()
                    }.bind(this)

                    this.connection.onclose = function(event) {
                        console.log(event)
                        console.log("Closed Connection to  Progress Websocket server")
                        this.stop()
                    }.bind(this)
                    
                    },
                delimiters: ['[[',']]'],
            })
    }

}
