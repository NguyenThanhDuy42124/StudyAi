
import { useEffect, useRef } from "react"

export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext("webgl2", { antialias: true })
    if (!gl) return

    const VERT = `#version 300 es
void main(){ vec2 p=vec2((gl_VertexID<<1)&2, gl_VertexID&2); gl_Position=vec4(p*2.0-1.0,0.0,1.0); }`

    const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
float hash(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<2;i++){ v+=a*noise(p); p=p*1.9+3.0; a*=0.55; } return v; }
vec3 auroraPal(float t){ // green -> teal -> violet
  return mix(mix(vec3(0.10,0.9,0.45), vec3(0.15,0.8,0.85), smoothstep(0.0,0.5,t)),
             vec3(0.6,0.35,0.95), smoothstep(0.5,1.0,t));
}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  vec2 p=(gl_FragCoord.xy-0.5*u_res)/u_res.y;
  float sway=(u_mouse.x-0.5)*1.2;
  // night sky gradient
  vec3 col=mix(vec3(0.02,0.03,0.09), vec3(0.03,0.06,0.16), uv.y);
  // stars
  vec2 sc=floor(gl_FragCoord.xy/3.0);
  float star=step(0.9975, hash(sc))*pow(hash(sc+7.0),2.0)*smoothstep(0.3,1.0,uv.y);
  col+=vec3(0.9,0.95,1.0)*star;
  // aurora curtains
  float t=u_time*0.15;
  for(int i=0;i<2;i++){
    float fi=float(i);
    float base=(fi-1.0)*0.55 + sway*(0.35+fi*0.2);
    float cx=base + sin(p.y*1.6 + t*2.0 + fi*2.1)*0.22 + (fbm(vec2(p.y*1.2+fi*3.0, t*1.5))-0.5)*0.7;
    float w=0.15 + 0.09*fbm(vec2(p.y*3.0+fi, t));
    float band=exp(-pow((p.x-cx)/w, 2.0));
    float vert=smoothstep(-0.95,0.8,p.y) * (0.45+0.55*fbm(vec2(p.x*5.0+fi*4.0, p.y*2.6 - t*2.5)));
    float ribbon=band*vert;
    float hue=fract(0.12 + fi*0.28 + p.y*0.16 + t*0.3);
    col += auroraPal(hue) * ribbon * (1.0 - fi*0.14);
  }
  // ground glow + vignette
  col *= 0.7+0.5*smoothstep(1.5,0.1,length(p*vec2(0.6,1.0)));
  col=col/(col+0.8);
  col+=(hash(gl_FragCoord.xy+u_time)-0.5)*0.02;
  o=vec4(pow(max(col,0.0),vec3(0.9)),1.0);
}`

    function sh(t: number, s: string) {
      const x = gl!.createShader(t)
      if (!x) return null
      gl!.shaderSource(x, s)
      gl!.compileShader(x)
      if (!gl!.getShaderParameter(x, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(x))
        return null
      }
      return x
    }
    
    const vs = sh(gl.VERTEX_SHADER, VERT)
    const fs = sh(gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const pr = gl.createProgram()
    if (!pr) return
    gl.attachShader(pr, vs)
    gl.attachShader(pr, fs)
    gl.linkProgram(pr)
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(pr))
      return
    }
    gl.useProgram(pr)

    const uRes = gl.getUniformLocation(pr, "u_res")
    const uTime = gl.getUniformLocation(pr, "u_time")
    const uMouse = gl.getUniformLocation(pr, "u_mouse")

    let mouse = [0.5, 0.5]
    let target = [0.5, 0.5]
    let animationFrameId: number

    const handlePointerMove = (e: PointerEvent) => {
      target = [e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight]
    }
    window.addEventListener("pointermove", handlePointerMove)

    function resize() {
      const d = 1 /* Optimized for performance */
      const w = window.innerWidth * d | 0
      const h = window.innerHeight * d | 0
      if (w === canvas!.width && h === canvas!.height) return
      canvas!.width = w
      canvas!.height = h
      gl!.viewport(0, 0, w, h)
    }
    window.addEventListener("resize", resize)
    resize()

    const t0 = performance.now()
    function frame(now: number) {
      resize()
      mouse[0] += (target[0] - mouse[0]) * 0.05
      mouse[1] += (target[1] - mouse[1]) * 0.05
      gl!.uniform2f(uRes, canvas!.width, canvas!.height)
      gl!.uniform1f(uTime, (now - t0) / 1000)
      gl!.uniform2f(uMouse, mouse[0], mouse[1])
      gl!.drawArrays(gl!.TRIANGLES, 0, 3)
      animationFrameId = requestAnimationFrame(frame)
    }
    animationFrameId = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      style={{ opacity: 0.8 }}
    />
  )
}
