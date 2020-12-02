import './index.scss'

const KEYS = 10
const VOICES = 10

window.addEventListener("load", () => {
    const starter = document.querySelector('#starter')
    starter.addEventListener('click', () => {
        starter.hidden = true
        start()
    })
})

function start() {
    const synth = setupSynth()
    // synth.startVoice(1)
    setupKeyfield(synth) 
}

function setupSynth() {
    const audioContext = new window.AudioContext()
    
    let voiceAmplitude = 0.5
    let baseFrequency = 440
    
    const compressorNode = audioContext.createDynamicsCompressor()
    compressorNode.connect(audioContext.destination)

    let ri = 0
    const voices = []
    for(let i = 0; i < VOICES; i++) {
        let gain = audioContext.createGain()
        gain.gain.value = 0
        let oscillator = audioContext.createOscillator()
        oscillator.type = "sine"
        oscillator.start()
        oscillator.connect(gain)
        gain.connect(compressorNode)
        voices[i] = {
            gain,
            oscillator,
            vacant: true
        }
    }
    
    return {
        startVoice: (freqf) => {
            for(let i = 0; i < VOICES; i++) {
                let pi = (ri + 1 + i) % VOICES
                if(voices[pi].vacant) {
                    let voice = voices[pi]
                    voice.vacant = false
                    voice.gain.gain.cancelScheduledValues(audioContext.currentTime)
                    voice.gain.gain.value = 0
                    voice.gain.gain.linearRampToValueAtTime(voiceAmplitude, audioContext.currentTime + 0.1)
                    voice.oscillator.frequency.value = baseFrequency * freqf
                    ri = pi
                    return ri
                }
            }
        }, 
        endVoice: (id) => {
            let voice = voices[id]
            voice.vacant = true
            let now = audioContext.currentTime
            voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0)
            voice.gain.gain.linearRampToValueAtTime(0, now + 2.01)
        }
    }
}

function setupKeyfield(synth) {
    const keyfield = document.querySelector("#keyfield")
    const canvas = setupCanvas(keyfield)
    let keyfieldSize = 1;
    
    let touches = {}

    const onresize = () => {
        keyfieldSize = Math.min(window.innerHeight, window.innerWidth)
        keyfield.style.height = keyfield.style.width = keyfieldSize + 'px'
        keyfield.style["background-size"] = (keyfieldSize * 2 / KEYS + 'px ').repeat(2)
        keyfield.width = keyfieldSize
        keyfield.height = keyfieldSize
        canvas.resize(keyfieldSize)
    }
    window.addEventListener('resize', onresize)
    onresize()

    const compareTouches = touchEvent => {
        
        console.log(touchEvent)
        let touchIds = []
        for(let i = 0; i < touchEvent.touches.length; i++) {
            let touch = touchEvent.touches[i]
            let id = touch.identifier
            touchIds.push(id)
            if(id in touches) {
                // update, bending etc :D
            } else {
                let num = KEYS - Math.floor(touch.pageX * KEYS / (keyfieldSize + 1))
                let denom = KEYS - Math.floor(touch.pageY * KEYS / (keyfieldSize + 1))
                touches[id] = {
                    num, denom, 
                    voiceId: synth.startVoice(num/denom) // TBD calculate and pass the frequency ratio
                }
                canvas.highlightKey(num, denom)
            }
        }
        
        console.log(touchIds)
        console.log(touches)

        for(let id in touches) {
            if(!(id in touchIds)) {
                let touch = touches[id]
                synth.endVoice(touch.voiceId)
                canvas.releaseKey(touch.num, touch.denom)
                delete touches[id]
            }
        }
        
        touchEvent.preventDefault()
        touchEvent.stopPropagation()
    }

    ['start', 'move', 'cancel', 'end'].map(eventName => {
        keyfield.addEventListener('touch' + eventName, compareTouches)
    })
}

function setupCanvas(canvasElement) {
    const ctx = canvasElement.getContext("2d")
    
    let tileSize = 1
    let canvasSize = KEYS
    
    let lastTime = Date.now()

    /*
    requestAnimationFrame(() => {
        let time = Date.now()
        let delta = time - lastTime
        let decay = Math.pow(0.3, delta / 1000)
        ctx.beginPath()
        ctx.rect(0, 0, canvasSize, canvasSize)
        ctx.fillStyle = `rgba(0,0,0,${Math.floor(255 * decay)}`
        ctx.fill(); 
        lastTime = time
    })
    */
            
    const primes = [2]
    for(let n = 3; n <= KEYS; n++) {
        let isPrime = true 
        for(let p of primes) {
            if(n % p == 0) {
                isPrime = false
                break
            }
        }
        if(isPrime){
            primes.push(n)
        }
    }
            
    return {
        resize: (side) => {
            canvasSize = side
            tileSize = side / KEYS   
        }, 
        highlightKey: (num, denom) => {
            for(let p of primes){
                while(num % p == 0 && denom % p == 0){
                    num = num / p
                    denom = denom / p
                }
            }
            let max = Math.max(num, denom)
            console.log(num, denom, max)
            for(let i = 1; i * max <= KEYS; i++) {
                ctx.beginPath()
                ctx.rect((KEYS - i * num) * tileSize, (KEYS - i * denom) * tileSize, tileSize, tileSize)
                ctx.fillStyle = "#4268d1"
                ctx.fill();
            }
        },
        releaseKey: (num, denom) => {
            for(let p of primes){
                while(num % p == 0 && denom % p == 0){
                    num = num / p
                    denom = denom / p
                }
            }
            let max = Math.max(num, denom)
            for(let i = 1; i * max <= KEYS; i++) {
                ctx.beginPath()
                ctx.clearRect((KEYS - i * num) * tileSize, (KEYS - i * denom) * tileSize, tileSize, tileSize)
            }
        }
    }
}
