// Leading Zero's
const zeroPad = (num, places) => String(num).padStart(places, '0')

// seconds to 'hh:mm:ss' string
const pos2str = (pos) => {
    pos = (pos >= 0) ? pos : 0 
    return `${zeroPad(Math.trunc(pos / 3600),2)}:${zeroPad(Math.trunc((pos % 3600) / 60),2)}:${zeroPad(Math.trunc(pos % 60,2),2)}`
}

// 'hh:mm:ss' string to seconds
const str2pos = (st) => {
    erg = parseInt(String(st).slice(0,2))*3600 + parseInt(String(st).slice(3,5))*60 + parseInt(String(st).slice(-2))
    return erg
}