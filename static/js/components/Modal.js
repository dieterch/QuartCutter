class VueModal {
    constructor() {
        this.component = Vue.component(
                        'Modal', {
                            props: ['section', 'movie', 'duration', 'duration_cut', 
                                    'cut_in', 'cut_out', 'apsc', 'eta', 'result'],
                            template: `
                            <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                <div class="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
                                <div class="modal-content">
                                    <div class="modal-header">
                                    <h4 class="modal-title" id="staticBackdropLabel">[[ movie ]]</h4>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div class="modal-body">
                                        <div class="container-fluid">
                                            <div class="row">
                                                <div class="col-md-4">Section:</div>
                                                <div class="col-md-4">[[ section ]]</div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-4">Duration Raw:</div>
                                                <div class="col-md-4">[[ duration ]] min</div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-4">Duration Cut:</div>
                                                <div class="col-md-4">[[ duration_cut ]] min</div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-4">In:</div>
                                                <div class="col-md-4">[[ cut_in ]]</div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-4">Out:</div>
                                                <div class="col-md-4">[[ cut_out ]]</div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-4">Recreate apsc:</div>
                                                <div class="col-md-4">[[ apsc ]]</div>
                                            </div>
                                            <hr>
                                            <div class="row">
                                                <div class="col-md-4">ETA:</div>
                                                <div class="col-md-4">[[ eta ]] sec</div>
                                            </div>
                                            <div class="row">
                                                <div class="col-md-12">[[ result ]]</div>
                                            </div>                                        </div>                                            
                                    </div>
                                    <div class="modal-footer">
                                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                                    </div>
                                </div>
                                </div>
                            </div>`,
                            delimiters: ['[[',']]']
                        })
    }

    show() {
        let me = new bootstrap.Modal(document.getElementById('staticBackdrop'), {
            keyboard: false
          })
        me.show()
    }

    hide() {
        let me = new bootstrap.Modal(document.getElementById('staticBackdrop'), {
            keyboard: false
          })
        me.hide()
    }
}

class VueModalSlot {
    constructor() {
        this.component = Vue.component(
                        'modalslot', {
                            props: ['showclosebutton'],
                            template: `
                            <div class="modal fade" id="staticBackdropSlot" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                <div class="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
                                <div class="modal-content">
                                    <div class="modal-header">
                                    <slot name="header">
                                    This is the default title!
                                    </slot>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" v-if="showclosebutton"></button>
                                    </div>
                                    <div class="modal-body">
                                        <slot name="body">
                                        This is the default body!
                                        </slot>
                                    </div>
                                    <div class="modal-footer">
                                        <slot name="footer">
                                        This is the default footer!
                                        </slot>
                                    </div>
                                </div>
                                </div>
                            </div>`,
                            delimiters: ['[[',']]']
                        })
    }

    show() {
        let me = new bootstrap.Modal(document.getElementById('staticBackdropSlot'), {
            keyboard: false
          })
        me.show()
    }

    hide() {
        let me = new bootstrap.Modal(document.getElementById('staticBackdropSlot'), {
            keyboard: false
          })
        me.hide()
    }
}