// sketch.js
let soundSketch = (p) => {
  let noise, bandpass, distortion, burstEnv;

  let clickOsc, clickFilter, clickEnv, clickPanner;
  let hiClickOsc, hiClickFilter, hiClickEnv;
  let sineLow, sineHigh, lowEnv, highEnv;
  let lowDistortion, highReverb, burstReverb;
  let bgNoise, bgNoiseFilter;
  let lastHighNote = 0, lastClick = 0;
  let clickStep = 0;
  let inRun = false, runStep = 0, lastRunClick = 0;
  let doubleSpeed = false, doubleSpeedEnd = 0;
  let lastBurstTime = 0, burstInterval = 1200;

  let masterBus, masterEQ, masterComp;
  let kickClickNoise, kickClickFilter, kickClickEnv;

  p.setup = function () {
    p.createCanvas(400, 200);
    masterBus = new p5.Gain();
    masterEQ = new p5.EQ(3);
    masterComp = new p5.Compressor();
    masterEQ.bands[0].freq(100); masterEQ.bands[0].gain(3);
    masterEQ.bands[1].freq(1000); masterEQ.bands[1].gain(-2.5);
    masterEQ.bands[2].freq(8000); masterEQ.bands[2].gain(1.5);
    masterComp.threshold(-20); masterComp.ratio(6);
    masterComp.attack(0.01); masterComp.release(0.3);
    masterBus.connect(masterEQ); masterEQ.connect(masterComp); masterComp.connect();
    noise = new p5.Noise('white'); noise.amp(0.1); noise.start();
    bandpass = new p5.BandPass(); bandpass.freq(3300); bandpass.res(4);
    noise.disconnect(); noise.connect(bandpass);
    distortion = new p5.Distortion(0.1, '4x'); bandpass.connect(distortion); distortion.connect(masterBus);
    highReverb = new p5.Reverb(); burstReverb = new p5.Reverb();
    bgNoise = new p5.Noise('white'); bgNoise.amp(0.02); bgNoise.start();
    bgNoiseFilter = new p5.BandPass(); bgNoiseFilter.freq(900); bgNoiseFilter.res(5);
    bgNoise.disconnect(); bgNoise.connect(bgNoiseFilter); bgNoiseFilter.connect(masterBus);
    burstEnv = new p5.Envelope(); burstEnv.setADSR(0.01,0.05,0,0.3); burstEnv.setRange(0.3,0);
    clickOsc = new p5.Oscillator('square'); clickOsc.start(); clickOsc.amp(0);
    clickFilter = new p5.BandPass(); clickPanner = new p5.Panner3D();
    clickOsc.disconnect(); clickOsc.connect(clickFilter); clickFilter.connect(clickPanner); clickPanner.connect(masterBus);
    clickEnv = new p5.Envelope(); clickEnv.setADSR(0.001,0.01,0,0.03); clickEnv.setRange(0.4,0);
    hiClickOsc = new p5.Oscillator('square'); hiClickOsc.start(); hiClickOsc.amp(0);
    hiClickFilter = new p5.BandPass(); hiClickFilter.res(5); hiClickOsc.disconnect(); hiClickOsc.connect(hiClickFilter);
    hiClickEnv = new p5.Envelope(); hiClickEnv.setADSR(0.001,0.01,0,0.02); hiClickEnv.setRange(0.3,0);
    highReverb.process(hiClickFilter,2.5,2); highReverb.drywet(0.4); highReverb.connect(masterBus);
    sineLow = new p5.Oscillator('sine'); sineLow.freq(43.65); sineLow.start(); sineLow.amp(0);
    lowDistortion = new p5.Distortion(0.05,'2x'); sineLow.disconnect(); sineLow.connect(lowDistortion); lowDistortion.connect(masterBus);
    lowEnv = new p5.Envelope();
    sineHigh = new p5.Oscillator('sine'); sineHigh.freq(698.46); sineHigh.start(); sineHigh.amp(0);
    highEnv = new p5.Envelope(); highReverb.process(sineHigh,2.5,2); highReverb.drywet(0.3);
    kickClickNoise = new p5.Noise('white'); kickClickNoise.start(); kickClickNoise.amp(0);
    kickClickFilter = new p5.HighPass(); kickClickFilter.freq(3000); kickClickFilter.res(3);
    kickClickNoise.disconnect(); kickClickNoise.connect(kickClickFilter); kickClickFilter.connect(masterBus);
    kickClickEnv = new p5.Envelope(); kickClickEnv.setADSR(0.001,0.005,0,0.01); kickClickEnv.setRange(0.2,0);
    document.addEventListener("visibilitychange",()=>{ if(document.hidden){bgNoise.amp(0,0.5);} else{bgNoise.amp(0.02,1);} });
    lastBurstTime = p.millis();
  };

  p.draw = function () {
    p.background(20); p.fill(255); p.textAlign(p.CENTER,p.CENTER);
    p.text("Sound sketch running...", p.width/2, p.height/2);
    let BPM=140; let clickInterval=(60000/BPM)/4;
    if(p.millis()-lastClick>clickInterval){ clickFilter.freq(p.random(1000,3500));
      clickFilter.res(p.random(3,8)); clickPanner.set(p.random(-0.7,0.7),0,0); clickEnv.play(clickOsc);
      if(p.random()<0.1){ setTimeout(()=>clickEnv.play(clickOsc),40); }
      if(clickStep%6===0||clickStep%4===3){ triggerLowKick(0.6); } else if(clickStep%8===6&&p.random()<0.4){ triggerLowKick(0.1); }
      if(!inRun&&p.random()<0.02){ inRun=true; runStep=0; }
      if(!doubleSpeed&&p.random()<0.01){ doubleSpeed=true; doubleSpeedEnd=p.millis()+p.random(800,1500); }
      clickStep++; lastClick=p.millis();
    }
    if(p.millis()-lastBurstTime>burstInterval){ if(p.random()<0.5){ burstEnv.play(noise);
        burstReverb.process(noise,0.1,2); burstReverb.drywet(0.2); burstReverb.connect(masterBus);} burstInterval=p.random(800,1600); lastBurstTime=p.millis(); }
    if(doubleSpeed&&p.millis()>doubleSpeedEnd){ doubleSpeed=false; }
    if(p.millis()-lastHighNote>1700){ let baseFreq=698.46; if(p.random()<0.15) baseFreq=659.25; sineHigh.freq(baseFreq);
      if(p.random()<0.5){ highEnv.setADSR(0.01,0.05,0,0.1); highEnv.setRange(0.2,0);} else { highEnv.setADSR(0.02,0.2,0,0.4); highEnv.setRange(0.3,0); }
      highEnv.play(sineHigh); lastHighNote=p.millis(); }
    if(inRun&&p.millis()-lastRunClick>50){ hiClickFilter.freq(p.random(8000,10000)); hiClickEnv.play(hiClickOsc); runStep++; lastRunClick=p.millis(); if(runStep>=16) inRun=false; }
  };

  function triggerLowKick(vol){ lowEnv.setADSR(0.01,0.01,0.7,0.2); lowEnv.setRange(3,0); lowEnv.play(sineLow); lowDistortion.set(p.random(0.0,0.003),'2x'); kickClickFilter.freq(p.random(2500,5000)); kickClickEnv.play(kickClickNoise); }
};