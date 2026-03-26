import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticleText = () => {
    const wrapRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        let reqId;
        let renderer;
        let scene;
        let cam;
        let geo;
        let pointsMat;
        const canvasEl = canvasRef.current;

        const initParticleTitle = async () => {
            await document.fonts.ready;

            const wrap = wrapRef.current;
            const canvas = canvasRef.current;
            if (!wrap || !canvas) return;

            const W = wrap.clientWidth || window.innerWidth;
            const H = wrap.clientHeight || 340;
            const DPR = Math.min(devicePixelRatio, 2);

            canvas.width = W * DPR;
            canvas.height = H * DPR;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';

            const off = document.createElement('canvas');
            off.width = W * DPR;
            off.height = H * DPR;
            const c2 = off.getContext('2d', { willReadFrequently: true });

            const pad = W * DPR * 0.02;
            const fs1 = Math.min(W * DPR * 0.108, 178);
            const fs2 = Math.min(W * DPR * 0.120, 200);

            c2.fillStyle = '#ffffff';
            c2.font = `300 ${fs1}px 'Cormorant Garamond', Georgia, serif`;
            c2.fillText('Energy That', pad, fs1 * 1.05);

            c2.font = `600 ${fs2}px 'Cormorant Garamond', Georgia, serif`;
            c2.fillText('Thinks Itself.', pad, fs1 * 1.05 + fs2 * 1.22);

            const imgD = c2.getImageData(0, 0, off.width, off.height);
            const raw = imgD.data;
            const OW = off.width, OH = off.height;
            const aspect = W / H;

            const SKIP = 3;
            const pts = [];
            for (let y = 0; y < OH; y += SKIP) {
                for (let x = 0; x < OW; x += SKIP) {
                    if (raw[(y * OW + x) * 4 + 3] > 110) {
                        const tx = ((x / OW) * 2 - 1) * aspect;
                        const ty = -((y / OH) * 2 - 1);
                        pts.push({
                            tx, ty,
                            cx: (Math.random() - .5) * aspect * 3,
                            cy: (Math.random() - .5) * 3,
                            vx: 0, vy: 0,
                            ph: Math.random() * Math.PI * 2,
                            b: 0.35 + Math.random() * 0.65,
                        });
                    }
                }
            }
            if (!pts.length) return;
            const N = pts.length;

            renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            renderer.setPixelRatio(DPR);
            renderer.setSize(W, H);
            renderer.setClearColor(0x000000, 0);

            scene = new THREE.Scene();
            cam = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
            cam.position.z = 1;

            const posArr = new Float32Array(N * 3);
            const colArr = new Float32Array(N * 3);
            pts.forEach((p, i) => { posArr[i * 3] = p.cx; posArr[i * 3 + 1] = p.cy; });

            geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

            pointsMat = new THREE.PointsMaterial({
                vertexColors: true,
                size: 1.7,
                sizeAttenuation: false,
                transparent: true,
                opacity: 0.94,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            scene.add(new THREE.Points(geo, pointsMat));

            let mNX = -99, mNY = -99, scattered = false, scatterTimer = null;

            const onMouseMove = e => {
                const r = canvas.getBoundingClientRect();
                mNX = ((e.clientX - r.left) / r.width * 2 - 1) * aspect;
                mNY = -((e.clientY - r.top) / r.height * 2 - 1);
            };
            const onMouseLeave = () => { mNX = -99; mNY = -99; };

            const onClick = () => {
                if (scattered) return;
                scattered = true;
                pts.forEach(p => {
                    const ang = Math.random() * Math.PI * 2;
                    const mag = 0.07 + Math.random() * 0.16;
                    p.vx = Math.cos(ang) * mag;
                    p.vy = Math.sin(ang) * mag;
                });
                clearTimeout(scatterTimer);
                scatterTimer = setTimeout(() => { scattered = false; }, 1800);
            };

            canvas.addEventListener('mousemove', onMouseMove);
            canvas.addEventListener('mouseleave', onMouseLeave);
            canvas.addEventListener('click', onClick);

            let t = 0, intro = 0;
            const pp = geo.attributes.position;
            const pc = geo.attributes.color;
            const REPEL_R = 0.20 * aspect;

            const loop = () => {
                reqId = requestAnimationFrame(loop);
                t += 0.013;
                intro = Math.min(intro + 0.009, 1);

                const spring = scattered ? 0.025 : 0.045 + intro * 0.025;

                pts.forEach((p, i) => {
                    if (!scattered) {
                        p.vx += (p.tx - p.cx) * spring;
                        p.vy += (p.ty - p.cy) * spring;
                    }

                    const dx = p.cx - mNX, dy = p.cy - mNY;
                    const d2 = dx * dx + dy * dy;
                    let proximity = 0;
                    if (d2 < REPEL_R * REPEL_R && d2 > 0.00001) {
                        const d = Math.sqrt(d2);
                        proximity = 1 - d / REPEL_R;
                        const frc = proximity * 0.026;
                        p.vx += (dx / d) * frc;
                        p.vy += (dy / d) * frc;
                    }

                    const breathAmp = scattered ? 0 : 0.0013;
                    p.vx += Math.sin(t * 1.7 + p.ph) * breathAmp;
                    p.vy += Math.cos(t * 1.5 + p.ph * 1.2) * breathAmp;

                    p.vx *= 0.80;
                    p.vy *= 0.80;
                    p.cx += p.vx;
                    p.cy += p.vy;
                    pp.setXYZ(i, p.cx, p.cy, 0);

                    const breathV = Math.sin(t * 2.4 + p.ph) * .5 + .5;
                    const e = Math.min(1, p.b * .45 + breathV * .28 + proximity * .75);
                    const lum = 0.6 + e * 0.4;
                    pc.setXYZ(i, lum, lum, lum);
                });

                pp.needsUpdate = true;
                pc.needsUpdate = true;
                renderer.render(scene, cam);
            };
            loop();

            const onResize = () => {
                const nW = wrap.clientWidth, nH = wrap.clientHeight;
                const na = nW / nH;
                renderer.setSize(nW, nH);
                cam.left = -na; cam.right = na;
                cam.updateProjectionMatrix();
            };
            window.addEventListener('resize', onResize);

            // Save cleanup data to refs if we needed to access them from the outer return
            canvas._cleanup = () => {
                canvas.removeEventListener('mousemove', onMouseMove);
                canvas.removeEventListener('mouseleave', onMouseLeave);
                canvas.removeEventListener('click', onClick);
                window.removeEventListener('resize', onResize);
                clearTimeout(scatterTimer);
            };
        };

        initParticleTitle();

        return () => {
            cancelAnimationFrame(reqId);
            if (canvasEl && canvasEl._cleanup) {
                canvasEl._cleanup();
            }
            if (renderer) renderer.dispose();
            if (geo) geo.dispose();
            if (pointsMat) pointsMat.dispose();
        };
    }, []);

    return (
        <div className="title-wrap" id="title-wrap" ref={wrapRef}>
            <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>Energy That Thinks Itself.</h1>
            <canvas id="txt-cv" ref={canvasRef}></canvas>
            <div className="title-hint">Hover / Click</div>
        </div>
    );
};

export default ParticleText;
