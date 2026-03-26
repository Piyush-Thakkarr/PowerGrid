import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PowerGrid = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const isMobile = window.matchMedia('(pointer: coarse)').matches;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
        renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 1);

        const scene = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
        cam.position.set(0, 20, 58);
        cam.lookAt(0, 0, 0);

        /* ══ GRID SETUP ══ */
        const GW = 88, GH = 55, STEP = 2.2;
        const COLS = Math.floor(GW / STEP) + 1, ROWS = Math.floor(GH / STEP) + 1, N = COLS * ROWS;

        // base XZ positions (never change)
        const baseX = new Float32Array(N), baseZ = new Float32Array(N);
        const gPh = new Float32Array(N);
        const nodeY = new Float32Array(N);
        const nodeEnergy = new Float32Array(N);

        let idx = 0;
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
            baseX[idx] = (c - COLS / 2) * STEP;
            baseZ[idx] = (r - ROWS / 2) * STEP;
            gPh[idx] = Math.random() * Math.PI * 2;
            idx++;
        }

        const HSEGS = ROWS * (COLS - 1), VSEGS = COLS * (ROWS - 1);
        const TOTAL_SEGS = HSEGS + VSEGS;
        const lArr = new Float32Array(TOTAL_SEGS * 2 * 3);
        const segA = new Int32Array(TOTAL_SEGS), segB = new Int32Array(TOTAL_SEGS);
        let si = 0;
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS - 1; c++) {
            const a = r * COLS + c, b = a + 1;
            segA[si] = a; segB[si] = b; si++;
        }
        for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS - 1; r++) {
            const a = r * COLS + c, b = a + COLS;
            segA[si] = a; segB[si] = b; si++;
        }

        const lGeo = new THREE.BufferGeometry();
        lGeo.setAttribute('position', new THREE.BufferAttribute(lArr, 3));
        const lCol = new Float32Array(TOTAL_SEGS * 2 * 3);
        lGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
        const lMat = new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, opacity: .7,
            blending: THREE.AdditiveBlending, depthWrite: false
        });
        const gridLines = new THREE.LineSegments(lGeo, lMat);
        scene.add(gridLines);

        const dArr = new Float32Array(N * 3), dCol = new Float32Array(N * 3);
        const dGeo = new THREE.BufferGeometry();
        dGeo.setAttribute('position', new THREE.BufferAttribute(dArr, 3));
        dGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
        const dotMat = new THREE.PointsMaterial({
            vertexColors: true, size: .18, transparent: true, opacity: .85,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
        });
        scene.add(new THREE.Points(dGeo, dotMat));

        const ripples = [];
        function addRipple(wx, wz, strength = 6) {
            ripples.push({ x: wx, z: wz, age: 0, maxAge: 2.8, strength });
        }

        const raycaster = new THREE.Raycaster();
        const mouse2 = new THREE.Vector2(-999, -999);
        const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const mouseWorld = new THREE.Vector3();

        const onMouseMove = e => {
            mouse2.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse2.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', onMouseMove);

        const surges = [];
        const lightnings = [];
        function spawnLightning(ox, oz) {
            const branches = Math.floor(Math.random() * 3) + 3;
            for (let b = 0; b < branches; b++) {
                const pts = [new THREE.Vector3(ox, 0, oz)];
                let cx = ox, cz = oz, cy = 0;
                const steps = 10 + Math.floor(Math.random() * 8);
                const ang = Math.random() * Math.PI * 2;
                for (let s = 0; s < steps; s++) {
                    cx += Math.cos(ang + s * .4 + (Math.random() - .5) * 1.5) * 3.5;
                    cz += Math.sin(ang + s * .4 + (Math.random() - .5) * 1.5) * 3.5;
                    cy += Math.sin(s * .8) * .8 + (Math.random() - .5) * .6;
                    pts.push(new THREE.Vector3(cx, cy, cz));
                }
                const geo = new THREE.BufferGeometry().setFromPoints(pts);
                const mat = new THREE.LineBasicMaterial({
                    color: 0x00eeff, transparent: true, opacity: .9,
                    blending: THREE.AdditiveBlending, depthWrite: false
                });
                const line = new THREE.Line(geo, mat);
                line.userData = { life: 0, maxLife: .55 + Math.random() * .25 };
                scene.add(line); lightnings.push(line);
            }
            surges.push({ x: ox, z: oz, age: 0, maxAge: 1.6 });
        }

        const bursts = [];
        function spawnBurst(ox, oz) {
            const COUNT = 28;
            const pos = new Float32Array(COUNT * 3), vel = [];
            for (let i = 0; i < COUNT; i++) {
                pos[i * 3] = ox; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = oz;
                const ang = Math.random() * Math.PI * 2;
                const spd = 4 + Math.random() * 8;
                vel.push({ vx: Math.cos(ang) * spd, vy: 1 + Math.random() * 5, vz: Math.sin(ang) * spd });
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({
                color: 0x00ccff, size: .35, transparent: true, opacity: 1,
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            const pts = new THREE.Points(geo, mat);
            pts.userData = { pos, vel, life: 0, maxLife: 1.4 };
            scene.add(pts); bursts.push(pts);
        }

        const onClick = isMobile ? null : (e => {
            // Skip effects only on actual interactive elements (links, buttons, inputs)
            const tag = e.target.tagName;
            if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
            raycaster.setFromCamera(mouse2, cam);
            raycaster.ray.intersectPlane(gridPlane, mouseWorld);
            addRipple(mouseWorld.x, mouseWorld.z, 8);
            spawnLightning(mouseWorld.x, mouseWorld.z);
            spawnBurst(mouseWorld.x, mouseWorld.z);
        });
        if (onClick) window.addEventListener('click', onClick);

        const arcObjects = [];
        function makeArc(forced) {
            const r = Math.floor(Math.random() * (ROWS - 1));
            const c = Math.floor(Math.random() * (COLS - 1));
            let cur = r * COLS + c;
            const path = [];
            for (let s = 0; s < 14; s++) {
                path.push(new THREE.Vector3(baseX[cur], 0, baseZ[cur]));
                const right = cur + 1, down = cur + COLS;
                if (right < N && Math.random() > .35) cur = right;
                else if (down < N) cur = down;
                else break;
            }
            const geo = new THREE.BufferGeometry().setFromPoints(path);
            const isHot = forced || Math.random() > .7;
            const mat = new THREE.LineBasicMaterial({
                color: isHot ? 0x00ffee : 0x0066cc, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending, depthWrite: false
            });
            const line = new THREE.Line(geo, mat);
            line.userData = { life: 0, maxLife: 1.8 + Math.random() * 2.4, hot: isHot, pathPts: path };
            scene.add(line); arcObjects.push(line);
        }
        for (let i = 0; i < 28; i++) makeArc();

        const bgV = [];
        const BGS = 140, BGST = 5.5;
        const BGCOLS = Math.floor(BGS / BGST) + 1, BGROWS = Math.floor(BGS / BGST) + 1;
        for (let r = 0; r < BGROWS; r++) { const z = (r - BGROWS / 2) * BGST; bgV.push((-BGCOLS / 2) * BGST, 0, z, (BGCOLS / 2) * BGST, 0, z) }
        for (let c = 0; c < BGCOLS; c++) { const x = (c - BGCOLS / 2) * BGST; bgV.push(x, 0, (-BGROWS / 2) * BGST, x, 0, (BGROWS / 2) * BGST) }
        const bgGeo = new THREE.BufferGeometry();
        bgGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bgV), 3));
        const bgGrid = new THREE.LineSegments(bgGeo, new THREE.LineBasicMaterial({ color: 0x00102a, transparent: true, opacity: .55, depthWrite: false }));
        bgGrid.position.y = -14; bgGrid.rotation.x = -0.16;
        scene.add(bgGrid);

        const AP = 140;
        const apPos = new Float32Array(AP * 3), apPh = new Float32Array(AP), apBase = new Float32Array(AP * 3);
        for (let i = 0; i < AP; i++) {
            apBase[i * 3] = (Math.random() - .5) * GW;
            apBase[i * 3 + 1] = Math.random() * 12 + .5;
            apBase[i * 3 + 2] = (Math.random() - .5) * GH;
            apPh[i] = Math.random() * Math.PI * 2;
            apPos[i * 3] = apBase[i * 3]; apPos[i * 3 + 1] = apBase[i * 3 + 1]; apPos[i * 3 + 2] = apBase[i * 3 + 2];
        }
        const apGeo = new THREE.BufferGeometry();
        apGeo.setAttribute('position', new THREE.BufferAttribute(apPos, 3));
        scene.add(new THREE.Points(apGeo, new THREE.PointsMaterial({
            color: 0x0099dd, size: .15, transparent: true, opacity: .45,
            blending: THREE.AdditiveBlending, depthWrite: false
        })));

        let nextAutoSurge = 6;
        let mx = 0, my = 0, tx = 0, ty = 0;
        const onMouseMoveParallax = e => {
            mx = (e.clientX / window.innerWidth - .5) * 2;
            my = (e.clientY / window.innerHeight - .5) * 2;
        };
        window.addEventListener('mousemove', onMouseMoveParallax);

        const onResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            cam.aspect = window.innerWidth / window.innerHeight;
            cam.updateProjectionMatrix();
        };
        window.addEventListener('resize', onResize);

        function energyColor(e, out) {
            const t = Math.min(e, 1);
            if (t < .5) { out[0] = 0; out[1] = .28 + t * .78; out[2] = .67 + t * .66; }
            else { const u = (t - .5) * 2; out[0] = u * .55; out[1] = .67 + u * .23; out[2] = 1; }
        }

        let t = 0, dt = 0, lastT = performance.now();
        const tmpCol = [0, 0, 0];
        let reqId;

        const loop = () => {
            reqId = requestAnimationFrame(loop);
            const now = performance.now();
            dt = Math.min((now - lastT) / 1000, .05); lastT = now;
            t += dt;

            tx += (mx * 4 - tx) * .045; ty += (my * 2 - ty) * .045;
            cam.position.x = tx; cam.position.y = 20 + ty * .7;

            raycaster.setFromCamera(mouse2, cam);
            raycaster.ray.intersectPlane(gridPlane, mouseWorld);
            const mwx = mouseWorld.x || 0, mwz = mouseWorld.z || 0;

            nextAutoSurge -= dt;
            if (nextAutoSurge <= 0) {
                const rx = (Math.random() - .5) * GW * .7, rz = (Math.random() - .5) * GH * .7;
                addRipple(rx, rz, 5);
                surges.push({ x: rx, z: rz, age: 0, maxAge: 1.8 });
                if (Math.random() > .4) spawnLightning(rx, rz);
                nextAutoSurge = 5 + Math.random() * 4;
            }

            for (let i = 0; i < N; i++) {
                const nx = baseX[i], nz = baseZ[i];
                let y = Math.sin(nx * .14 + t) * Math.cos(nz * .14 + t * .7) * 1.2
                    + Math.sin(nx * .08 + t * 1.4) * .5
                    + Math.sin(nz * .11 + t * .9) * .6
                    + Math.sin(gPh[i] + t * .6) * .25;

                const dxm = nx - mwx, dzm = nz - mwz;
                const distM = Math.sqrt(dxm * dxm + dzm * dzm);
                const pullR = 10;
                let energy = 0;
                if (distM < pullR) {
                    const influence = 1 - distM / pullR;
                    y += influence * influence * 3.5;
                    energy = Math.max(energy, influence * .9);
                }

                for (const rp of ripples) {
                    const age = rp.age;
                    const waveR = age * 22;
                    const dxr = nx - rp.x, dzr = nz - rp.z;
                    const distR = Math.sqrt(dxr * dxr + dzr * dzr);
                    const ringW = 5;
                    const diff = Math.abs(distR - waveR);
                    if (diff < ringW) {
                        const amp = (1 - diff / ringW) * (1 - age / rp.maxAge) * rp.strength;
                        y += amp;
                        energy = Math.max(energy, amp / rp.strength * .85);
                    }
                }

                for (const sg of surges) {
                    const sr = sg.age * 28;
                    const dxs = nx - sg.x, dzs = nz - sg.z;
                    const ds = Math.sqrt(dxs * dxs + dzs * dzs);
                    const diff = Math.abs(ds - sr);
                    if (diff < 4) {
                        const amp = (1 - diff / 4) * (1 - sg.age / sg.maxAge);
                        energy = Math.max(energy, amp);
                    }
                }

                nodeY[i] = y;
                nodeEnergy[i] = Math.max(energy, nodeEnergy[i] * .92);
            }

            const lp = lGeo.attributes.position, lc = lGeo.attributes.color;
            for (let s = 0; s < TOTAL_SEGS; s++) {
                const a = segA[s], b = segB[s];
                const ax = baseX[a], ay = nodeY[a], az = baseZ[a];
                const bx = baseX[b], by = nodeY[b], bz = baseZ[b];
                lp.setXYZ(s * 2, ax, ay, az);
                lp.setXYZ(s * 2 + 1, bx, by, bz);
                const ea = nodeEnergy[a], eb = nodeEnergy[b];
                energyColor(ea * .6 + .05, tmpCol); lc.setXYZ(s * 2, tmpCol[0], tmpCol[1], tmpCol[2]);
                energyColor(eb * .6 + .05, tmpCol); lc.setXYZ(s * 2 + 1, tmpCol[0], tmpCol[1], tmpCol[2]);
            }
            lp.needsUpdate = true; lc.needsUpdate = true;

            const dp = dGeo.attributes.position, dc = dGeo.attributes.color;
            for (let i = 0; i < N; i++) {
                dp.setXYZ(i, baseX[i], nodeY[i], baseZ[i]);
                energyColor(nodeEnergy[i] + .04, tmpCol);
                dc.setXYZ(i, tmpCol[0], tmpCol[1], tmpCol[2]);
            }
            dp.needsUpdate = true; dc.needsUpdate = true;

            for (let ai = arcObjects.length - 1; ai >= 0; ai--) {
                const a = arcObjects[ai];
                a.userData.life += dt;
                if (a.userData.life > a.userData.maxLife) {
                    scene.remove(a); a.geometry.dispose(); a.material.dispose(); arcObjects.splice(ai, 1); makeArc(); continue;
                }
                const prog = a.userData.life / a.userData.maxLife;
                a.material.opacity = Math.sin(prog * Math.PI) * (a.userData.hot ? .7 : .38);
                const aPos = a.geometry.attributes.position;
                if (aPos) a.userData.pathPts.forEach((pt, pi) => {
                    let best = -1, bestD = 1e9;
                    for (let i = 0; i < N; i++) {
                        const dx = baseX[i] - pt.x, dz = baseZ[i] - pt.z, d = dx * dx + dz * dz;
                        if (d < bestD) { bestD = d; best = i; }
                    }
                    if (best >= 0) aPos.setY(pi, nodeY[best]);
                });
                if (aPos) aPos.needsUpdate = true;
            }

            for (let i = ripples.length - 1; i >= 0; i--) {
                ripples[i].age += dt;
                if (ripples[i].age > ripples[i].maxAge) ripples.splice(i, 1);
            }
            for (let i = surges.length - 1; i >= 0; i--) {
                surges[i].age += dt;
                if (surges[i].age > surges[i].maxAge) surges.splice(i, 1);
            }
            for (let i = lightnings.length - 1; i >= 0; i--) {
                const l = lightnings[i];
                l.userData.life += dt;
                const p = l.userData.life / l.userData.maxLife;
                l.material.opacity = (1 - p) * (Math.random() > .25 ? 1 : 0);
                if (p >= 1) { scene.remove(l); lightnings.splice(i, 1); }
            }
            for (let bi = bursts.length - 1; bi >= 0; bi--) {
                const b = bursts[bi];
                b.userData.life += dt;
                const life = b.userData.life, max = b.userData.maxLife;
                if (life > max) { scene.remove(b); b.geometry.dispose(); b.material.dispose(); bursts.splice(bi, 1); continue; }
                b.material.opacity = 1 - life / max;
                const bp = b.geometry.attributes.position;
                const pos = b.userData.pos, vel = b.userData.vel;
                vel.forEach((v, i) => {
                    v.vy -= 4 * dt;
                    pos[i * 3] += v.vx * dt;
                    pos[i * 3 + 1] += v.vy * dt;
                    pos[i * 3 + 2] += v.vz * dt;
                    bp.setXYZ(i, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
                });
                bp.needsUpdate = true;
            }

            const ap = apGeo.attributes.position;
            for (let i = 0; i < AP; i++) {
                apPos[i * 3] = apBase[i * 3] + Math.sin(t * .4 + apPh[i]) * .9;
                apPos[i * 3 + 1] = apBase[i * 3 + 1] + Math.sin(t * .6 + apPh[i] * 1.3) * .7;
                apPos[i * 3 + 2] = apBase[i * 3 + 2] + Math.cos(t * .35 + apPh[i]) * .9;
                ap.setXYZ(i, apPos[i * 3], apPos[i * 3 + 1], apPos[i * 3 + 2]);
            }
            ap.needsUpdate = true;

            const scr = window.scrollY * .009;
            cam.rotation.x = -scr * .042;
            cam.position.z = 58 - scr * 1.3;

            renderer.render(scene, cam);
        };
        loop();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousemove', onMouseMoveParallax);
            if (onClick) window.removeEventListener('click', onClick);
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(reqId);

            arcObjects.forEach(a => { scene.remove(a); a.geometry.dispose(); a.material.dispose(); });
            lightnings.forEach(l => { scene.remove(l); l.geometry.dispose(); l.material.dispose(); });
            bursts.forEach(b => { scene.remove(b); b.geometry.dispose(); b.material.dispose(); });

            renderer.dispose();
            bgGrid.geometry.dispose();
            bgGrid.material.dispose();
            gridLines.geometry.dispose();
            gridLines.material.dispose();
            dGeo.dispose();
            dotMat.dispose();
            apGeo.dispose();
        };
    }, []);

    return <canvas id="cv" ref={canvasRef}></canvas>;
};

export default PowerGrid;
