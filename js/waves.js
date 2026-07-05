/* ============================================================
   DealProof — WebGL wave engine (Three.js)
   Braided particle waveform: GPU-displaced point grid, simplex
   fbm + weaving gaussian ribbons, pointer ripples, theme lerp.
   ============================================================ */
'use strict';

(function () {
  const NOISE_GLSL = `
  // Simplex 3D noise — Ashima Arts / Stefan Gustavson (MIT)
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  float fbm(vec3 p){
    float f = 0.0, a = 0.55;
    for (int i = 0; i < 4; i++){
      f += a * snoise(p);
      p = p * 2.02 + vec3(11.7, 5.3, 7.1);
      a *= 0.5;
    }
    return f;
  }`;

  const VERT = NOISE_GLSL + `
  uniform float uTime;
  uniform float uAmp;
  uniform float uKick;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uFlow;
  uniform vec3 uColDeep;
  uniform vec3 uColL;
  uniform vec3 uColR;
  uniform vec3 uColHot;
  uniform vec4 uRipples[6];
  varying vec3 vColor;
  varying float vAlpha;

  float braidHeight(vec2 p, float t, out float ribbon){
    float x = p.x, z = p.y;
    float c1 = sin(x * 0.34 + t * 0.55) * 1.05 + sin(x * 0.121 - t * 0.21) * 0.62;
    float c2 = sin(x * 0.265 - t * 0.44 + 2.3) * 0.95 + cos(x * 0.171 + t * 0.29) * 0.5;
    float b1 = exp(-pow((z - c1 * 0.6) / 1.05, 2.0));
    float b2 = exp(-pow((z - c2 * 0.6 + 0.9) / 1.25, 2.0));
    ribbon = max(b1, b2 * 0.85);
    float form = fbm(vec3(x * 0.33 - t * uFlow, z * 0.52, t * 0.16));
    float detail = fbm(vec3(x * 0.95 + 7.3 - t * uFlow * 1.6, z * 1.2, t * 0.30));
    return (b1 * 1.25 + b2 * 0.95) * (0.5 + 0.8 * form) + detail * 0.28 * (0.25 + ribbon);
  }

  void main(){
    vec3 pos = position;
    float t = uTime;
    float ribbon;
    float h = braidHeight(pos.xz, t, ribbon);

    // pointer ripples: expanding damped rings
    float rip = 0.0;
    for (int i = 0; i < 6; i++){
      vec4 r = uRipples[i];
      if (r.w > 0.001){
        float age = t - r.z;
        float d = distance(pos.xz, r.xy);
        rip += sin(d * 5.5 - age * 6.0) * exp(-d * 0.6) * exp(-age * 1.6) * r.w;
      }
    }

    float amp = uAmp * (1.0 + uKick * 0.9);
    pos.y += h * amp + rip * 0.55;

    float e = clamp(h * 0.62 + rip * 0.8, 0.0, 1.6);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = uSize * uPixelRatio * (0.55 + e * 1.7) * (120.0 / max(dist, 1.0));
    gl_PointSize = min(gl_PointSize, 9.0 * uPixelRatio);

    // spectrum gradient: hue sweeps across x and drifts with time/depth
    float g = clamp(position.x / 26.0 + 0.5
                    + 0.22 * sin(t * 0.14 + position.z * 0.35)
                    + 0.10 * sin(position.x * 0.18 - t * 0.23), 0.0, 1.0);
    vec3 base = mix(uColL, uColR, g);
    vec3 col = mix(uColDeep, base, smoothstep(0.04, 0.68, e));
    col = mix(col, uColHot, smoothstep(0.78, 1.3, e));
    vColor = col * (1.0 + uKick * 0.55);

    float a = 0.045 + 0.9 * smoothstep(0.05, 0.95, e);
    a *= smoothstep(15.5, 11.5, abs(position.x));            // side fade
    a *= clamp(1.35 - (dist - 6.0) / 11.0, 0.15, 1.0);       // depth fade
    vAlpha = a;
  }`;

  const FRAG = `
  precision mediump float;
  varying vec3 vColor;
  varying float vAlpha;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float glow = pow(smoothstep(0.5, 0.0, d), 1.8);
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }`;

  // Multicolor gradient palettes: l → r sweeps across the field,
  // deep anchors the troughs, hot tips the crests.
  const THEMES = {
    playbook:   { deep: 0x120e38, l: 0x1fc8f0, r: 0xa855f7, hot: 0xfff0d4, amp: 1.00, flow: 0.10 },
    pipeline:   { deep: 0x0d1636, l: 0x2fd4a0, r: 0x4f6cf7, hot: 0xeafff4, amp: 1.12, flow: 0.14 },
    deal:       { deep: 0x101034, l: 0x4f9cf7, r: 0xc26cf0, hot: 0xffeedd, amp: 0.92, flow: 0.08 },
    discovery:  { deep: 0x0e1530, l: 0x25c9b4, r: 0x7d7bf5, hot: 0xf2fbff, amp: 1.05, flow: 0.12 },
    objections: { deep: 0x1a1030, l: 0xf0a422, r: 0xd857c4, hot: 0xfff6df, amp: 1.08, flow: 0.13 },
    emails:     { deep: 0x0f1234, l: 0x38aef8, r: 0xef6cb2, hot: 0xfff2ea, amp: 0.96, flow: 0.10 },
    team:       { deep: 0x0c1630, l: 0x30d970, r: 0x2f9cf0, hot: 0xf0fff2, amp: 1.10, flow: 0.13 },
    inspect:    { deep: 0x101332, l: 0x55e0e8, r: 0x9c7bf7, hot: 0xf4f6ff, amp: 0.94, flow: 0.09 },
    coaching:   { deep: 0x0e142e, l: 0x4fe0c0, r: 0x8460f0, hot: 0xf0fbff, amp: 0.90, flow: 0.08 }
  };

  function hexToRgb(hex) {
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
  }

  const Waves = {
    ok: false, motion: true, _decimated: 0,

    init(canvas) {
      if (!window.THREE) return false;
      try {
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
      } catch (e) { return false; }
      const R = this.renderer;
      this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      R.setPixelRatio(this.dpr);
      R.setClearColor(0x000000, 0);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);
      this.camera.position.set(0, 1.9, 7.4);
      this.camera.lookAt(0, 0.15, 0);

      this.uniforms = {
        uTime: { value: 0 },
        uAmp: { value: 1 },
        uKick: { value: 0 },
        uSize: { value: 2.0 },
        uPixelRatio: { value: this.dpr },
        uFlow: { value: 0.1 },
        uColDeep: { value: new THREE.Vector3(...hexToRgb(THEMES.playbook.deep)) },
        uColL: { value: new THREE.Vector3(...hexToRgb(THEMES.playbook.l)) },
        uColR: { value: new THREE.Vector3(...hexToRgb(THEMES.playbook.r)) },
        uColHot: { value: new THREE.Vector3(...hexToRgb(THEMES.playbook.hot)) },
        uRipples: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0)) }
      };
      this._target = {
        deep: hexToRgb(THEMES.playbook.deep),
        l: hexToRgb(THEMES.playbook.l),
        r: hexToRgb(THEMES.playbook.r),
        hot: hexToRgb(THEMES.playbook.hot),
        amp: 1, flow: 0.1
      };

      this.material = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });

      this._buildGrid(1);
      this._buildDust();

      this._ripIdx = 0;
      this._mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      this._time = 0;
      this._last = performance.now();
      this._fpsAcc = 0; this._fpsN = 0;
      this._needsFrame = true;

      window.addEventListener('pointermove', e => {
        this._mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        this._mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
      window.addEventListener('pointerdown', e => {
        this.ripple(e.clientX / window.innerWidth, e.clientY / window.innerHeight, 0.9);
      }, { passive: true });
      window.addEventListener('resize', () => this._resize());
      document.addEventListener('visibilitychange', () => { this._last = performance.now(); });

      this._resize();
      this.ok = true;
      this._loop();
      return true;
    },

    _buildGrid(scale) {
      if (this.points) { this.scene.remove(this.points); this.points.geometry.dispose(); }
      const NX = Math.round(360 * scale), NZ = Math.round(200 * scale);
      const n = NX * NZ;
      const posArr = new Float32Array(n * 3);
      let p = 0;
      for (let ix = 0; ix < NX; ix++) {
        for (let iz = 0; iz < NZ; iz++) {
          posArr[p++] = (ix / (NX - 1) - 0.5) * 30;         // x: -15..15
          posArr[p++] = 0;
          posArr[p++] = (iz / (NZ - 1) - 0.5) * 11 - 0.6;   // z: -6.1..4.9
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      this.points = new THREE.Points(geo, this.material);
      this.points.frustumCulled = false;
      this.scene.add(this.points);
    },

    _buildDust() {
      const n = 900;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        arr[i * 3] = (Math.random() - 0.5) * 34;
        arr[i * 3 + 1] = Math.random() * 7 - 1;
        arr[i * 3 + 2] = -Math.random() * 14 - 2;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const mat = new THREE.PointsMaterial({
        color: 0x7fa8ff, size: 0.035, transparent: true, opacity: 0.32,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
      });
      this.dust = new THREE.Points(geo, mat);
      this.dust.frustumCulled = false;
      this.scene.add(this.dust);
    },

    _resize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this._needsFrame = true;
    },

    setTheme(name) {
      const th = THEMES[name] || THEMES.playbook;
      this._target.deep = hexToRgb(th.deep);
      this._target.l = hexToRgb(th.l);
      this._target.r = hexToRgb(th.r);
      this._target.hot = hexToRgb(th.hot);
      this._target.amp = th.amp;
      this._target.flow = th.flow;
      this._needsFrame = true;
    },

    pulse(s) {
      this.uniforms.uKick.value = Math.min(1.4, this.uniforms.uKick.value + (s || 0.7));
      this._needsFrame = true;
    },

    // x,y in 0..1 screen space → project onto the wave plane
    ripple(x, y, amp) {
      if (!this.ok) return;
      const ndc = new THREE.Vector3(x * 2 - 1, -(y * 2 - 1), 0.5).unproject(this.camera);
      const dir = ndc.sub(this.camera.position).normalize();
      const t = -this.camera.position.y / (dir.y || -0.0001);
      if (t < 0 || t > 60) return;
      const px = this.camera.position.x + dir.x * t;
      const pz = this.camera.position.z + dir.z * t;
      const r = this.uniforms.uRipples.value[this._ripIdx % 6];
      r.set(px, pz, this._time, amp || 0.8);
      this._ripIdx++;
      this._needsFrame = true;
    },

    setMotion(on) {
      this.motion = on;
      this._needsFrame = true;
    },

    _loop() {
      requestAnimationFrame(() => this._loop());
      if (!this.ok || document.hidden) return;

      const now = performance.now();
      let dt = (now - this._last) / 1000;
      this._last = now;
      dt = Math.min(dt, 0.05);

      // Reduced motion: near-still field, but keep theme fades alive
      const speed = this.motion ? 1 : 0.03;
      this._time += dt * 0.55 * speed;

      const u = this.uniforms, tg = this._target;
      const lerp = (a, b, f) => a + (b - a) * f;
      const f = 1 - Math.exp(-dt * 3.2);
      ['Deep', 'L', 'R', 'Hot'].forEach(name => {
        const v = u['uCol' + name].value, t = tg[name.toLowerCase()];
        v.x = lerp(v.x, t[0], f); v.y = lerp(v.y, t[1], f); v.z = lerp(v.z, t[2], f);
      });
      u.uAmp.value = lerp(u.uAmp.value, tg.amp, f);
      u.uFlow.value = lerp(u.uFlow.value, tg.flow, f);
      u.uKick.value *= Math.exp(-dt * 2.1);
      u.uTime.value = this._time;

      // camera parallax
      const m = this._mouse;
      m.x = lerp(m.x, m.tx, 1 - Math.exp(-dt * 2.5));
      m.y = lerp(m.y, m.ty, 1 - Math.exp(-dt * 2.5));
      this.camera.position.x = m.x * 0.9;
      this.camera.position.y = 1.9 - m.y * 0.35;
      this.camera.lookAt(m.x * 0.35, 0.15, 0);

      if (this.dust) this.dust.rotation.y = this._time * 0.008;

      if (!this.motion && !this._needsFrame && u.uKick.value < 0.01) return;
      this._needsFrame = this.motion || u.uKick.value >= 0.01;

      this.renderer.render(this.scene, this.camera);

      // adaptive quality: if consistently slow, thin the grid (max twice)
      if (this.motion && this._decimated < 2) {
        this._fpsAcc += dt; this._fpsN++;
        if (this._fpsN >= 120) {
          const avg = this._fpsN / this._fpsAcc;
          if (avg < 34) {
            this._decimated++;
            this._buildGrid(this._decimated === 1 ? 0.68 : 0.48);
          }
          this._fpsAcc = 0; this._fpsN = 0;
        }
      }
    }
  };

  window.DCC = window.DCC || {};
  DCC.Waves = Waves;
})();
