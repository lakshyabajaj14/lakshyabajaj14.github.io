/* Robot animations: hero arm (inverse kinematics), scroll walker (gait cycle),
   tactile grid (pressure map). Plain SVG and canvas, no libraries. */
(() => {
    'use strict';

    const NS = 'http://www.w3.org/2000/svg';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const TAU = Math.PI * 2;

    const el = (name, attrs = {}, parent) => {
        const node = document.createElementNS(NS, name);
        Object.keys(attrs).forEach(key => node.setAttribute(key, attrs[key]));
        if (parent) parent.appendChild(node);
        return node;
    };
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
    const approachAngle = (current, target, k) => current + wrapAngle(target - current) * k;
    const fmtDeg = rad => {
        const deg = wrapAngle(rad) * 180 / Math.PI;
        return `${deg < 0 ? '−' : '+'}${Math.abs(deg).toFixed(1).padStart(5, ' ')}°`;
    };

    // Track whether an element is on screen so its loop can idle when it is not
    const watchVisibility = (node, state) => {
        if (!('IntersectionObserver' in window)) { state.visible = true; return; }
        new IntersectionObserver(entries => {
            state.visible = entries[entries.length - 1].isIntersecting;
        }).observe(node);
    };

    const tickers = [];

    // ------------------------------------------------------------------
    // 1. Hero arm: 3R planar manipulator
    // ------------------------------------------------------------------
    function initArm() {
        const svg = document.getElementById('arm-svg');
        if (!svg) return;
        const readout = document.getElementById('arm-readout');
        const modeLabel = document.getElementById('arm-mode');

        const GROUND = 392;
        const S = { x: 200, y: 318 };          // shoulder
        const L1 = 140, L2 = 120, L3 = 44;     // link lengths
        const HOVER = 290;                     // tool height while travelling
        const BLOCK = 16;
        const PADS = [330, 430];
        const HOME = { x: 312, y: 196 };

        // --- static drawing ---
        el('circle', { class: 'r-faint', cx: S.x, cy: S.y, r: L1 + L2 + L3, 'stroke-dasharray': '2 7' }, svg);
        el('line', { class: 'r-ink', x1: 24, y1: GROUND, x2: 536, y2: GROUND, 'stroke-width': 1.5 }, svg);
        for (let x = 30; x < 536; x += 14) {
            el('line', { class: 'r-soft', x1: x, y1: GROUND, x2: x - 8, y2: GROUND + 9, 'stroke-width': 1 }, svg);
        }
        PADS.forEach((x, i) => {
            el('rect', { class: 'r-panel', x: x - 17, y: GROUND - 3, width: 34, height: 3, 'stroke-width': 1.2 }, svg);
            el('text', { class: 'r-text', x, y: GROUND + 26, 'text-anchor': 'middle' }, svg).textContent = i === 0 ? 'A' : 'B';
        });
        el('line', { class: 'r-accent', x1: S.x, y1: S.y, x2: S.x + 52, y2: S.y, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
        const angleArc = el('path', { class: 'r-accent', 'stroke-width': 1 }, svg);
        const angleText = el('text', { class: 'r-text-accent', x: S.x + 58, y: S.y + 4 }, svg);
        angleText.textContent = 'θ1';
        el('path', {
            class: 'r-panel', 'stroke-width': 1.5,
            d: `M${S.x - 40} ${GROUND} L${S.x - 26} ${S.y + 34} L${S.x - 13} ${S.y + 34} L${S.x - 13} ${S.y} L${S.x + 13} ${S.y} L${S.x + 13} ${S.y + 34} L${S.x + 26} ${S.y + 34} L${S.x + 40} ${GROUND} Z`
        }, svg);

        // --- moving parts: each link is an ink capsule with a paper core ---
        const block = el('rect', { class: 'r-accent-fill', width: BLOCK, height: BLOCK, x: -BLOCK / 2, y: -BLOCK / 2 }, svg);
        const capsule = (wOuter, wInner) => ({
            outer: el('line', { class: 'r-ink', 'stroke-width': wOuter }, svg),
            inner: el('line', { class: 'r-body', 'stroke-width': wInner }, svg)
        });
        const tool = capsule(9, 6);
        const link2 = capsule(15, 12);
        const link1 = capsule(19, 16);
        const fingers = [
            el('path', { class: 'r-ink', 'stroke-width': 2 }, svg),
            el('path', { class: 'r-ink', 'stroke-width': 2 }, svg)
        ];
        const palm = el('line', { class: 'r-ink', 'stroke-width': 2 }, svg);
        const joint = (r) => {
            const g = el('g', {}, svg);
            el('circle', { class: 'r-panel', r, 'stroke-width': 1.5 }, g);
            el('circle', { class: 'r-dot', r: 2 }, g);
            return g;
        };
        const jShoulder = joint(10), jElbow = joint(8), jWrist = joint(6);
        const cross = el('g', { opacity: 0 }, svg);
        el('circle', { class: 'r-accent', r: 7, 'stroke-width': 1 }, cross);
        el('path', { class: 'r-accent', d: 'M-12 0H12M0 -12V12', 'stroke-width': 1 }, cross);

        // --- inverse kinematics: tool tip T and tool angle phi -> joint angles ---
        const solve = (T, phi) => {
            let wx = T.x - L3 * Math.cos(phi) - S.x;
            let wy = Math.min(T.y - L3 * Math.sin(phi), GROUND - 10) - S.y;
            const d = clamp(Math.hypot(wx, wy), 34, L1 + L2 - 2);
            const base = Math.atan2(wy, wx);
            wx = d * Math.cos(base);
            wy = d * Math.sin(base);
            const cosElbow = clamp((d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2), -1, 1);
            const bend = Math.acos(cosElbow);
            // Two solutions; keep the one with the elbow higher on screen
            let best = null;
            [1, -1].forEach(sign => {
                const t1 = base - Math.atan2(L2 * Math.sin(sign * bend), L1 + L2 * Math.cos(sign * bend));
                const elbowY = S.y + L1 * Math.sin(t1);
                if (!best || elbowY < best.elbowY) best = { a1: t1, a2: t1 + sign * bend, elbowY };
            });
            return { a1: best.a1, a2: best.a2, a3: phi };
        };

        // --- state ---
        const first = solve(HOME, Math.PI / 2);
        const q = { a1: first.a1, a2: first.a2, a3: first.a3 };
        const state = { visible: true };
        let grip = 1;            // 1 open, 0 closed
        let gripTarget = 1;
        let carrying = false;
        const REST = GROUND - BLOCK / 2;
        const blockState = { x: PADS[0], y: REST, rot: 0, vy: 0 };
        const tip = { x: HOME.x, y: HOME.y };      // current tool tip, updated every draw
        let userGrip = false;                       // mouse button held in tracking mode
        let toolDir = Math.PI / 2;                  // tool heading in tracking mode
        const travel = { x: 0, y: 0 };              // recent cursor travel, picks the heading
        let follow = false;
        let lastMove = 0;
        const cursor = { x: HOME.x, y: HOME.y };
        let lastReadout = 0;

        // --- pick-and-place program ---
        let program = [];
        let stepIndex = 0;
        let stepTime = 0;
        let stepFrom = { x: HOME.x, y: HOME.y };

        const buildProgram = () => {
            // Pick the block up from wherever it lies and carry it to the farther pad
            const from = blockState.x;
            const to = Math.abs(from - PADS[0]) > Math.abs(from - PADS[1]) ? PADS[0] : PADS[1];
            const down = REST;
            program = [
                { p: { x: from, y: HOVER }, dur: 900 },
                { p: { x: from, y: down }, dur: 650 },
                { p: { x: from, y: down }, dur: 320, done: () => { gripTarget = 0; carrying = true; } },
                { p: { x: from, y: down }, dur: 260 },
                { p: { x: from, y: HOVER }, dur: 650 },
                { p: { x: to, y: HOVER }, dur: 900 },
                { p: { x: to, y: down }, dur: 650 },
                { p: { x: to, y: down }, dur: 320, done: () => { gripTarget = 1; carrying = false; blockState.x = to; blockState.y = REST; blockState.rot = 0; blockState.vy = 0; } },
                { p: { x: to, y: HOVER }, dur: 600 },
                { p: { x: HOME.x, y: HOME.y }, dur: 900 },
                { p: { x: HOME.x, y: HOME.y }, dur: 1100 }
            ];
            stepIndex = 0;
            stepTime = 0;
        };
        buildProgram();

        const programTarget = (dt) => {
            let step = program[stepIndex];
            stepTime += dt;
            while (stepTime >= step.dur) {
                stepTime -= step.dur;
                stepFrom = step.p;
                if (step.done) step.done();
                stepIndex += 1;
                if (stepIndex >= program.length) buildProgram();
                step = program[stepIndex];
            }
            const k = easeInOut(stepTime / step.dur);
            return {
                x: stepFrom.x + (step.p.x - stepFrom.x) * k,
                y: stepFrom.y + (step.p.y - stepFrom.y) * k
            };
        };

        // --- drawing ---
        const setLine = (line, a, b) => {
            line.setAttribute('x1', a.x.toFixed(2)); line.setAttribute('y1', a.y.toFixed(2));
            line.setAttribute('x2', b.x.toFixed(2)); line.setAttribute('y2', b.y.toFixed(2));
        };
        const setCapsule = (c, a, b) => { setLine(c.outer, a, b); setLine(c.inner, a, b); };
        const place = (g, p) => g.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);

        const draw = () => {
            const E = { x: S.x + L1 * Math.cos(q.a1), y: S.y + L1 * Math.sin(q.a1) };
            const W = { x: E.x + L2 * Math.cos(q.a2), y: E.y + L2 * Math.sin(q.a2) };
            const ux = Math.cos(q.a3), uy = Math.sin(q.a3);   // tool direction
            const nx = -uy, ny = ux;                          // tool normal
            const T = { x: W.x + L3 * ux, y: W.y + L3 * uy };
            const P = { x: W.x + (L3 - 14) * ux, y: W.y + (L3 - 14) * uy };

            setCapsule(link1, S, E);
            setCapsule(link2, E, W);
            setCapsule(tool, W, P);
            place(jShoulder, S); place(jElbow, E); place(jWrist, W);

            const half = BLOCK / 2 + 1 + grip * 5;
            setLine(palm, { x: P.x + nx * half, y: P.y + ny * half }, { x: P.x - nx * half, y: P.y - ny * half });
            [1, -1].forEach((side, i) => {
                const bx = P.x + nx * half * side, by = P.y + ny * half * side;
                fingers[i].setAttribute('d', `M${bx.toFixed(2)} ${by.toFixed(2)}L${(bx + ux * 19).toFixed(2)} ${(by + uy * 19).toFixed(2)}`);
            });

            tip.x = T.x; tip.y = T.y;
            if (carrying) {
                blockState.x = T.x;
                blockState.y = Math.min(T.y, REST);
                blockState.rot = (q.a3 - Math.PI / 2) * 180 / Math.PI;
                blockState.vy = 0;
            }
            block.setAttribute('transform', `translate(${blockState.x.toFixed(2)} ${blockState.y.toFixed(2)}) rotate(${blockState.rot.toFixed(2)})`);

            // θ1 arc from the horizontal reference to link 1
            const r = 30;
            const sweep = wrapAngle(q.a1);
            const end = { x: S.x + r * Math.cos(sweep), y: S.y + r * Math.sin(sweep) };
            angleArc.setAttribute('d', `M${S.x + r} ${S.y}A${r} ${r} 0 0 ${sweep < 0 ? 0 : 1} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`);
        };

        const writeReadout = (now) => {
            if (!readout || now - lastReadout < 90) return;
            lastReadout = now;
            // Screen y points down, so negate to report counter-clockwise as positive
            readout.textContent = `θ1 ${fmtDeg(-q.a1)}  θ2 ${fmtDeg(-(q.a2 - q.a1))}  θ3 ${fmtDeg(-(q.a3 - q.a2))}`;
        };

        // Let go of the block: it falls to the floor at a spot the arm can reach again
        const releaseBlock = () => {
            gripTarget = 1;
            if (!carrying) return;
            carrying = false;
            let x = clamp(blockState.x, 60, 452);
            if (Math.abs(x - S.x) < 62) x = S.x + (x < S.x ? -62 : 62);
            blockState.x = x;
        };

        const setMode = (tracking) => {
            if (follow === tracking) return;
            follow = tracking;
            cross.setAttribute('opacity', tracking ? 1 : 0);
            if (modeLabel) modeLabel.textContent = tracking ? 'Tracking · click to grip' : 'Pick and place';
            // Either way the hand-over starts with an open, empty gripper
            userGrip = false;
            releaseBlock();
            if (tracking) {
                travel.x = 0; travel.y = 0;
            } else {
                stepFrom = { x: tip.x, y: tip.y };
                buildProgram();
            }
        };

        // --- pointer tracking (mouse only; touch devices keep the idle program) ---
        if (!reduceMotion.matches) {
            window.addEventListener('pointermove', (e) => {
                if (e.pointerType !== 'mouse' || !state.visible) return;
                // Track only while the cursor is inside the figure box
                const box = svg.getBoundingClientRect();
                if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) {
                    if (!userGrip) setMode(false);
                    return;
                }
                const ctm = svg.getScreenCTM();
                if (!ctm) return;
                const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
                if (follow) {
                    // The gripper opens toward where the cursor is heading:
                    // moving down -> faces down, moving left -> faces left, and so on.
                    travel.x = travel.x * 0.7 + (pt.x - cursor.x);
                    travel.y = travel.y * 0.7 + (pt.y - cursor.y);
                    if (Math.hypot(travel.x, travel.y) > 9) {
                        toolDir = Math.abs(travel.x) > Math.abs(travel.y)
                            ? (travel.x > 0 ? 0 : Math.PI)
                            : (travel.y > 0 ? Math.PI / 2 : -Math.PI / 2);
                    }
                }
                cursor.x = pt.x;
                cursor.y = pt.y;
                lastMove = performance.now();
                setMode(true);
            }, { passive: true });

            // Click and hold closes the gripper; if it is over the block, the block comes along
            window.addEventListener('pointerdown', (e) => {
                if (e.pointerType !== 'mouse' || e.button !== 0 || !follow) return;
                userGrip = true;
                gripTarget = 0;
                lastMove = performance.now();
                if (Math.hypot(tip.x - blockState.x, tip.y - blockState.y) < BLOCK * 1.1) carrying = true;
            });
            const letGo = () => {
                if (!userGrip) return;
                userGrip = false;
                releaseBlock();
            };
            window.addEventListener('pointerup', letGo);
            window.addEventListener('pointercancel', letGo);
            window.addEventListener('blur', letGo);
        }

        const tick = (dt, now) => {
            if (!state.visible) return;
            // Hand back to the program after a pause, unless the user is holding the gripper shut
            if (follow && !userGrip && now - lastMove > 2400) setMode(false);

            // A released block drops to the floor and settles flat
            if (!carrying && (blockState.y < REST || blockState.rot !== 0)) {
                blockState.vy += 0.0022 * dt;
                blockState.y = Math.min(REST, blockState.y + blockState.vy * dt);
                const flat = Math.round(blockState.rot / 90) * 90;
                blockState.rot += (flat - blockState.rot) * (1 - Math.exp(-dt / 70));
                if (blockState.y >= REST) {
                    blockState.vy = 0;
                    if (Math.abs(flat - blockState.rot) < 0.5) blockState.rot = 0;
                }
            }

            let goal;
            if (follow) {
                // Tool tip goes to the cursor (kept inside the workspace and above the floor),
                // with the gripper facing the direction the cursor last travelled
                const dx = cursor.x - S.x, dy = cursor.y - S.y;
                const ang = Math.atan2(dy, dx);
                const dist = Math.min(Math.hypot(dx, dy), L1 + L2 + L3 - 4);
                const T = { x: S.x + dist * Math.cos(ang), y: Math.min(S.y + dist * Math.sin(ang), REST) };
                place(cross, T);
                goal = solve(T, toolDir);
            } else {
                goal = solve(programTarget(dt), Math.PI / 2);
            }

            const k = 1 - Math.exp(-dt / (follow ? 110 : 70));
            q.a1 = approachAngle(q.a1, goal.a1, k);
            q.a2 = approachAngle(q.a2, goal.a2, k);
            q.a3 = approachAngle(q.a3, goal.a3, k);
            grip += (gripTarget - grip) * (1 - Math.exp(-dt / 60));

            draw();
            writeReadout(now);
        };

        draw();
        writeReadout(1000);
        if (reduceMotion.matches) return;   // static pose only
        watchVisibility(svg, state);
        tickers.push(tick);
    }

    // ------------------------------------------------------------------
    // 2. Scroll walker: humanoid whose gait is driven by scroll distance
    // ------------------------------------------------------------------
    function initWalker() {
        const wrap = document.getElementById('walker');
        const svg = document.getElementById('walker-svg');
        if (!wrap || !svg) return;

        const HIP = { x: 24, y: 34 };
        const THIGH = 13, SHIN = 13;
        const FLOOR = 58.5;        // ankle height when standing (viewBox floor is 60)
        const STRIDE = 7, LIFT = 5;

        const g = el('g', {}, svg);
        // far side first so the near side overlaps it
        const farArm = el('path', { class: 'r-soft', 'stroke-width': 2 }, g);
        const farLeg = el('path', { class: 'r-soft', 'stroke-width': 2.4 }, g);
        const body = el('g', {}, g);
        el('rect', { class: 'r-panel', x: 17, y: 13, width: 14, height: 21, rx: 2, 'stroke-width': 1.5 }, body);
        el('line', { class: 'r-ink', x1: 24, y1: 9, x2: 24, y2: 13, 'stroke-width': 1.5 }, body);
        el('rect', { class: 'r-panel', x: 17, y: 1, width: 14, height: 9, rx: 2, 'stroke-width': 1.5 }, body);
        el('line', { class: 'r-accent', x1: 24, y1: 5.5, x2: 29, y2: 5.5, 'stroke-width': 2 }, body);
        const nearLeg = el('path', { class: 'r-ink', 'stroke-width': 2.4 }, g);
        const nearArm = el('path', { class: 'r-ink', 'stroke-width': 2 }, g);
        const hipDot = el('circle', { class: 'r-panel', r: 2.6, 'stroke-width': 1.2 }, g);

        const legPath = (phase, activity, stance) => {
            // Foot path: on the ground for half the cycle, lifted for the other half.
            // `stance` offsets the feet when standing so both legs read clearly.
            const fx = HIP.x + stance * (1 - activity) + STRIDE * Math.cos(phase) * activity;
            const fy = FLOOR - LIFT * Math.max(0, -Math.sin(phase)) * activity;
            const dx = fx - HIP.x, dy = fy - HIP.y;
            const d = Math.min(Math.hypot(dx, dy), THIGH + SHIN - 0.2);
            const base = Math.atan2(dy, dx);
            const bend = Math.acos(clamp((d * d + THIGH * THIGH - SHIN * SHIN) / (2 * d * THIGH), -1, 1));
            // Reverse knee: pick the solution that puts the knee behind the hip line
            const kneeAngle = base + bend;
            const kx = HIP.x + THIGH * Math.cos(kneeAngle), ky = HIP.y + THIGH * Math.sin(kneeAngle);
            const ax = HIP.x + d * Math.cos(base), ay = HIP.y + d * Math.sin(base);
            return `M${HIP.x} ${HIP.y}L${kx.toFixed(2)} ${ky.toFixed(2)}L${ax.toFixed(2)} ${ay.toFixed(2)}h6`;
        };

        const armPath = (phase, activity) => {
            const sx = 24, sy = 16;
            const swing = Math.PI / 2 + Math.sin(phase) * 0.55 * activity;
            const ex = sx + 8 * Math.cos(swing), ey = sy + 8 * Math.sin(swing);
            const fore = swing - 0.45;
            return `M${sx} ${sy}L${ex.toFixed(2)} ${ey.toFixed(2)}L${(ex + 7 * Math.cos(fore)).toFixed(2)} ${(ey + 7 * Math.sin(fore)).toFixed(2)}`;
        };

        let phase = 0;
        let activity = 0;
        let dir = 1;
        let lastY = window.scrollY;
        let lastScroll = -1e9;
        let x = 0;
        let targetX = 0;
        let dirty = true;

        const measure = () => {
            const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const span = Math.max(0, window.innerWidth - wrap.offsetWidth - 24);
            targetX = 12 + span * clamp(window.scrollY / max, 0, 1);
        };

        const draw = () => {
            const bob = -Math.abs(Math.sin(phase)) * 1.4 * activity;
            g.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`);
            body.setAttribute('transform', `rotate(${(4 * activity).toFixed(2)} 24 34)`);
            hipDot.setAttribute('cx', HIP.x); hipDot.setAttribute('cy', HIP.y);
            nearLeg.setAttribute('d', legPath(phase, activity, 3));
            farLeg.setAttribute('d', legPath(phase + Math.PI, activity, -3));
            nearArm.setAttribute('d', armPath(phase + Math.PI, activity));
            farArm.setAttribute('d', armPath(phase, activity));
            wrap.style.transform = `translateX(${x.toFixed(1)}px) scaleX(${dir})`;
        };

        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            const delta = y - lastY;
            lastY = y;
            if (delta === 0) return;
            dir = delta > 0 ? 1 : -1;
            if (!reduceMotion.matches) phase = (phase + Math.abs(delta) * 0.075) % TAU;
            lastScroll = performance.now();
            measure();
            dirty = true;
        }, { passive: true });
        window.addEventListener('resize', () => { measure(); dirty = true; });

        measure();
        x = targetX;
        draw();

        tickers.push((dt, now) => {
            const moving = now - lastScroll < 150 && !reduceMotion.matches;
            const goal = moving ? 1 : 0;
            if (!dirty && Math.abs(activity - goal) < 0.005 && Math.abs(targetX - x) < 0.2) return;
            activity += (goal - activity) * (1 - Math.exp(-dt / 120));
            x += (targetX - x) * (1 - Math.exp(-dt / 140));
            dirty = false;
            draw();
        });
    }

    // ------------------------------------------------------------------
    // 3. Tactile grid: 16x16 pressure map on canvas
    // ------------------------------------------------------------------
    function initTactile() {
        const canvas = document.getElementById('tactile-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const readout = document.getElementById('tactile-readout');
        const N = 16;
        const values = new Float32Array(N * N);
        const state = { visible: true };
        const colors = { ink: '#4A4F57', accent: '#F0531C' };
        let size = 0;
        let touch = null;          // { col, row } in cell units while pressed
        let lastTouch = -1e9;
        let lastReadout = 0;
        let quiet = false;

        const readColors = () => {
            const styles = getComputedStyle(document.documentElement);
            colors.ink = styles.getPropertyValue('--ink-soft').trim() || colors.ink;
            colors.accent = styles.getPropertyValue('--accent').trim() || colors.accent;
            quiet = false;
        };

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            size = rect.width;
            canvas.width = Math.round(rect.width * dpr);
            canvas.height = Math.round(rect.width * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            quiet = false;
        };

        const press = (col, row, amount) => {
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    const d2 = (c - col) * (c - col) + (r - row) * (r - row);
                    if (d2 > 16) continue;
                    const i = r * N + c;
                    values[i] = Math.min(1, values[i] + amount * Math.exp(-d2 / 3.2));
                }
            }
        };

        const draw = () => {
            const cell = size / N;
            ctx.clearRect(0, 0, size, size);
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    const v = values[r * N + c];
                    const cx = (c + 0.5) * cell, cy = (r + 0.5) * cell;
                    ctx.globalAlpha = 0.45;
                    ctx.fillStyle = colors.ink;
                    ctx.beginPath();
                    ctx.arc(cx, cy, Math.max(1, cell * 0.07), 0, TAU);
                    ctx.fill();
                    if (v > 0.02) {
                        ctx.globalAlpha = 0.25 + 0.75 * v;
                        ctx.fillStyle = colors.accent;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cell * (0.1 + 0.36 * v), 0, TAU);
                        ctx.fill();
                    }
                }
            }
            ctx.globalAlpha = 1;
        };

        const writeReadout = (now) => {
            if (!readout || now - lastReadout < 120) return;
            lastReadout = now;
            let peak = 0, at = 0;
            for (let i = 0; i < values.length; i++) if (values[i] > peak) { peak = values[i]; at = i; }
            readout.textContent = peak < 0.03
                ? 'Peak 0.00 · no contact'
                : `Peak ${peak.toFixed(2)} · R${String(Math.floor(at / N) + 1).padStart(2, '0')} C${String((at % N) + 1).padStart(2, '0')}`;
        };

        const toCell = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                col: (e.clientX - rect.left) / rect.width * N - 0.5,
                row: (e.clientY - rect.top) / rect.height * N - 0.5
            };
        };
        const onPoint = (e) => { touch = toCell(e); lastTouch = performance.now(); quiet = false; };
        canvas.addEventListener('pointerdown', onPoint);
        canvas.addEventListener('pointermove', onPoint);
        ['pointerleave', 'pointerup', 'pointercancel'].forEach(type => canvas.addEventListener(type, () => { touch = null; }));

        document.addEventListener('themechange', () => { readColors(); });
        if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
        window.addEventListener('resize', resize);

        readColors();
        resize();
        draw();
        watchVisibility(canvas, state);

        tickers.push((dt, now) => {
            if (!state.visible) return;
            const seconds = dt / 1000;
            let active = false;
            if (touch) {
                press(touch.col, touch.row, 5 * seconds);
                active = true;
            } else if (!reduceMotion.matches && now - lastTouch > 1800) {
                // Idle: a light "ghost" fingertip wanders the array
                const t = now / 1000;
                press(7.5 + 5.5 * Math.sin(t * 0.7), 7.5 + 5.5 * Math.sin(t * 1.13 + 1), 1.6 * seconds);
                active = true;
            }
            const decay = Math.exp(-seconds * 3);
            let any = false;
            for (let i = 0; i < values.length; i++) {
                values[i] *= decay;
                if (values[i] > 0.004) any = true; else values[i] = 0;
            }
            if (!active && !any) {
                if (quiet) return;
                quiet = true;       // draw one last clean frame, then rest
            }
            draw();
            writeReadout(now);
        });
    }

    // ------------------------------------------------------------------
    // Shared animation loop
    // ------------------------------------------------------------------
    const start = () => {
        initArm();
        initWalker();
        initTactile();
        if (!tickers.length) return;

        let last = performance.now();
        const frame = (now) => {
            const dt = Math.min(now - last, 50);   // clamp so a background tab doesn't jump
            last = now;
            for (let i = 0; i < tickers.length; i++) tickers[i](dt, now);
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
