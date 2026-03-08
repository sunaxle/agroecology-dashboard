document.addEventListener('DOMContentLoaded', () => {

    // --- Shared DOM Elements ---
    const sunSlider = document.getElementById('sunSlider');
    const timeDisplay = document.getElementById('timeDisplay');
    const playBtn = document.getElementById('playBtn');

    // Analytics
    const tempExposedEl = document.getElementById('tempExposed');
    const tempShadedEl = document.getElementById('tempShaded');
    const tempDiffEl = document.getElementById('tempDiff');

    let isPlaying = false;
    let playInterval;

    // --- Shared Time/Temperature Logic ---
    function formatTime(decimalTime) {
        const hrs = Math.floor(decimalTime);
        const mins = Math.round((decimalTime - hrs) * 60);
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        const displayHr = hrs > 12 ? hrs - 12 : (hrs === 0 ? 12 : hrs);
        const displayMin = mins < 10 ? '0' + mins : mins;
        return `${displayHr}:${displayMin} ${ampm}`;
    }

    const tempCurveExposed = [74, 76, 82, 88, 94, 98, 102, 104, 105, 102, 98, 94, 88];
    const tempCurveShaded = [74, 75, 79, 83, 86, 89, 90, 91, 92, 90, 88, 85, 82];

    function calculateTemps(decimalHour) {
        const curveIndex = decimalHour - 6;
        const lowerIdx = Math.floor(curveIndex);
        let upperIdx = Math.ceil(curveIndex);
        if (upperIdx > 12) upperIdx = 12; // cap max index
        const fraction = curveIndex - lowerIdx;

        let expT, shdT;
        if (lowerIdx === upperIdx) {
            expT = tempCurveExposed[lowerIdx] || 74;
            shdT = tempCurveShaded[lowerIdx] || 74;
        } else {
            expT = tempCurveExposed[lowerIdx] + fraction * (tempCurveExposed[upperIdx] - tempCurveExposed[lowerIdx]);
            shdT = tempCurveShaded[lowerIdx] + fraction * (tempCurveShaded[upperIdx] - tempCurveShaded[lowerIdx]);
        }

        const eDisplay = Math.round(expT);
        const sDisplay = Math.round(shdT);
        const diff = eDisplay - sDisplay;

        tempExposedEl.textContent = `${eDisplay}°F`;
        tempShadedEl.textContent = `${sDisplay}°F`;
        tempDiffEl.textContent = `↓ ${diff}°F Cooling Effect in Shade`;
        tempDiffEl.style.color = diff > 8 ? '#1b5e20' : '#2e7d32';
    }


    // --- Global Materials ---
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 }); // Dark Brown
    const oakTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6e6259, roughness: 0.9 }); // Greying Bark

    // Foliage Colors
    const cypressG1 = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.8 }); // Weeping green
    const cypressG2 = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 });
    const cypressG3 = new THREE.MeshStandardMaterial({ color: 0x3cb371, roughness: 0.8 });

    const oakG1 = new THREE.MeshStandardMaterial({ color: 0x1e5631, roughness: 0.8 }); // Darker, denser oak leaves
    const oakG2 = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.8 });

    const mesquiteG = new THREE.MeshStandardMaterial({ color: 0x8f9779, roughness: 0.7 }); // Dusty/silvery green
    const retamaG = new THREE.MeshStandardMaterial({ color: 0x9acd32, roughness: 0.7 }); // Yellowish green
    const elmG = new THREE.MeshStandardMaterial({ color: 0x4c9a2a, roughness: 0.8 });

    const childMat = new THREE.MeshStandardMaterial({ color: 0xffa500, roughness: 0.5 }); // Orange kid shirt
    const readerMat = new THREE.MeshStandardMaterial({ color: 0x4169e1, roughness: 0.5 }); // Blue kid shirt
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd }); // Skin tone

    // Helper to build a generic child mesh
    function createChildMesh(shirtMaterial) {
        const group = new THREE.Group();
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        const body = new THREE.Mesh(bodyGeo, shirtMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.0;
        head.castShadow = true;
        group.add(body);
        group.add(head);
        return group;
    }


    // ==========================================
    // SCENE 1: Single Montezuma Cypress
    // ==========================================
    const s1 = (function () {
        const container = document.getElementById('canvasContainer1');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xdcecf8);
        scene.fog = new THREE.Fog(0xdcecf8, 20, 100);

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(25, 12, 30);
        camera.lookAt(0, 5, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        controls.minDistance = 10;
        controls.maxDistance = 80;
        controls.target.set(0, 5, 0);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.8;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xfffff0, 1.2);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 100;
        const d = 25;
        sunLight.shadow.camera.left = -d;
        sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d;
        sunLight.shadow.camera.bottom = -d;
        scene.add(sunLight);

        // Ground Thermal Gradient
        const groundGeo = new THREE.PlaneGeometry(100, 100, 64, 64);
        const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
        const colors = [];
        for (let i = 0; i < groundGeo.attributes.position.count; i++) { colors.push(1, 0.4, 0); }
        groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        // Tree
        const treeGroup = new THREE.Group();
        const tGeo = new THREE.CylinderGeometry(1.5, 2.5, 12, 8);
        const trunk = new THREE.Mesh(tGeo, trunkMat);
        trunk.position.y = 6;
        trunk.castShadow = true; trunk.receiveShadow = true;
        treeGroup.add(trunk);

        function addFol(x, y, z, rx, ry, mat) {
            const lGeo = new THREE.SphereGeometry(rx, 16, 16);
            lGeo.scale(1, 0.6, 1);
            const l = new THREE.Mesh(lGeo, mat);
            l.position.set(x, y, z);
            l.rotation.x = Math.random() * 0.2; l.rotation.z = Math.random() * 0.2;
            l.castShadow = true; l.receiveShadow = true;
            treeGroup.add(l);
        }
        addFol(0, 12, 0, 10, 10, cypressG1);
        addFol(4, 11, 3, 7, 7, cypressG2);
        addFol(-3, 11.5, 4, 8, 8, cypressG3);
        addFol(-4, 10.5, -3, 6.5, 6.5, cypressG1);
        addFol(3, 11, -4, 7.5, 7.5, cypressG2);
        addFol(0, 15, 0, 9, 9, cypressG2);
        addFol(2, 16, -2, 6, 6, cypressG3);
        addFol(-2, 17, 2, 5, 5, cypressG1);
        addFol(0, 19, 0, 4, 4, cypressG2);
        scene.add(treeGroup);

        // Child
        const child = createChildMesh(childMat);
        child.position.set(3, 0, 3);
        scene.add(child);

        return {
            container, scene, camera, renderer, controls, sunLight, ambientLight, groundGeo, child,
            updateLighting: (xPos, yPos, zPos, angle) => {
                sunLight.position.set(xPos, yPos + 5, zPos);
                ambientLight.intensity = 0.2 + (Math.sin(angle) * 0.4);
                sunLight.intensity = 0.5 + (Math.sin(angle) * 0.8);

                const dir = new THREE.Vector3(0 - xPos, 10 - (yPos + 5), 0 - zPos).normalize();
                const dist = (yPos + 5) / Math.abs(dir.y);
                const isDay = dir.y < 0;

                let shadowX = 0; let shadowZ = 0;
                if (isDay) {
                    shadowX = xPos + dir.x * dist;
                    shadowZ = zPos + dir.z * dist;
                    const followRadius = 6;
                    const angleToShadow = Math.atan2(shadowZ, shadowX);
                    child.position.set(Math.cos(angleToShadow) * followRadius, 0, Math.sin(angleToShadow) * followRadius);
                    child.position.y = isPlaying ? Math.abs(Math.sin(Date.now() * 0.01)) * 0.2 : 0;
                }

                if (groundGeo.attributes.color) {
                    const colors = groundGeo.attributes.color.array;
                    const pos = groundGeo.attributes.position.array;
                    const heatIntensity = Math.sin(angle);
                    for (let i = 0; i < pos.length; i += 3) {
                        const wX = pos[i]; const wZ = pos[i + 1];
                        const distToTrunk = Math.sqrt(wX * wX + wZ * wZ);
                        const distToShadow = Math.sqrt((wX - shadowX) * (wX - shadowX) + (wZ - shadowZ) * (wZ - shadowZ));

                        if ((distToShadow < 12 && isDay) || distToTrunk < 8 || !isDay) {
                            colors[i] = 0.1; colors[i + 1] = 0.6; colors[i + 2] = 0.3;
                        } else {
                            colors[i] = 1.0; colors[i + 1] = 0.5 - (0.3 * heatIntensity); colors[i + 2] = 0.1;
                        }
                    }
                    groundGeo.attributes.color.needsUpdate = true;
                }
            }
        };
    })();


    // ==========================================
    // SCENE 2: Multi-Tree Microforest
    // ==========================================
    const s2 = (function () {
        const container = document.getElementById('canvasContainer2');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xdcecf8);
        scene.fog = new THREE.Fog(0xdcecf8, 20, 100);

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(30, 15, 35);
        camera.lookAt(0, 5, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        controls.minDistance = 10; controls.maxDistance = 100;
        controls.target.set(0, 5, 0);
        controls.autoRotate = true; controls.autoRotateSpeed = 0.8;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xfffff0, 1.2);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048; sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5; sunLight.shadow.camera.far = 100;
        const d = 35; // Wider shadow map bounds for scattered trees
        sunLight.shadow.camera.left = -d; sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d; sunLight.shadow.camera.bottom = -d;
        scene.add(sunLight);

        // Ground
        const groundGeo = new THREE.PlaneGeometry(120, 120, 64, 64);
        const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
        scene.add(ground);
        const colors = [];
        for (let i = 0; i < groundGeo.attributes.position.count; i++) { colors.push(1, 0.4, 0); }
        groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));


        // --- Helper to spawn generic trees ---
        function spawnTree(x, z, h, w, trunkW, tMat, lMats) {
            const grp = new THREE.Group();
            const tGeo = new THREE.CylinderGeometry(trunkW * 0.6, trunkW, h, 8);
            const tr = new THREE.Mesh(tGeo, tMat);
            tr.position.y = h / 2;
            tr.castShadow = true; tr.receiveShadow = true;
            grp.add(tr);

            // Add 3-5 randomized sphere layers for canopy
            const folLayers = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < folLayers; i++) {
                const sGeo = new THREE.SphereGeometry(w * (0.6 + Math.random() * 0.4), 12, 12);
                sGeo.scale(1, 0.6 + Math.random() * 0.4, 1);
                // Randomly pick one of the provided leaf materials
                const lMat = lMats[Math.floor(Math.random() * lMats.length)];
                const leaf = new THREE.Mesh(sGeo, lMat);
                // Scatter them slightly around the top of the trunk
                leaf.position.set(
                    (Math.random() - 0.5) * w * 0.5,
                    h + (Math.random() - 0.5) * w * 0.5,
                    (Math.random() - 0.5) * w * 0.5
                );
                leaf.castShadow = true; leaf.receiveShadow = true;
                grp.add(leaf);
            }
            grp.position.set(x, 0, z);
            scene.add(grp);
            return { x, z, canopyRadius: w * 1.2, height: h }; // Return specs for shadow/child tracking
        }

        const trees = [];
        // 1. Montezuma Cypress (Center)
        trees.push(spawnTree(0, 0, 12, 8, 2.5, trunkMat, [cypressG1, cypressG2, cypressG3]));
        // 2. Mature Live Oak (Off Center)
        trees.push(spawnTree(14, 8, 8, 11, 3.0, oakTrunkMat, [oakG1, oakG2]));
        // 3. Cedar Elm
        trees.push(spawnTree(-12, 10, 10, 5, 1.2, trunkMat, [elmG]));
        // 4. Retama
        trees.push(spawnTree(-8, -14, 6, 4, 0.8, trunkMat, [retamaG]));
        // 5. Honey Mesquite
        trees.push(spawnTree(15, -10, 7, 6, 1.5, trunkMat, [mesquiteG]));
        // 6. Texas Ebony
        trees.push(spawnTree(20, -2, 9, 8, 1.8, trunkMat, [oakG1, cypressG3]));


        // --- Children ---
        // 1 Static Reader
        const readerChild = createChildMesh(readerMat);
        readerChild.position.set(-2, 0, 2); // Sit right at edge of center Cypress base
        scene.add(readerChild);

        // Books block
        const bookG = new THREE.BoxGeometry(0.3, 0.1, 0.4);
        const bookM = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const book = new THREE.Mesh(bookG, bookM);
        book.position.set(-1.8, 0.5, 2.3);
        book.rotation.y = -Math.PI / 4;
        scene.add(book);

        // 10 Runners
        const runners = [];
        for (let i = 0; i < 10; i++) {
            const r = createChildMesh(childMat);
            r.position.set(Math.random() * 40 - 20, 0, Math.random() * 40 - 20);
            scene.add(r);
            // Give each child an assigned "favorite" tree to shadow-track, so they distribute evenly
            const favoriteTree = trees[i % trees.length];
            // Add some noise to their tracking so they don't form a perfect single-file line
            runners.push({
                mesh: r,
                targetTree: favoriteTree,
                offsetX: (Math.random() - 0.5) * 4,
                offsetZ: (Math.random() - 0.5) * 4
            });
        }


        return {
            container, scene, camera, renderer, controls, sunLight, ambientLight, groundGeo, runners, trees,
            updateLighting: (xPos, yPos, zPos, angle) => {
                sunLight.position.set(xPos, yPos + 5, zPos);
                ambientLight.intensity = 0.2 + (Math.sin(angle) * 0.4);
                sunLight.intensity = 0.5 + (Math.sin(angle) * 0.8);

                const sunDir = new THREE.Vector3(0 - xPos, 10 - (yPos + 5), 0 - zPos).normalize();
                const isDay = sunDir.y < 0;

                // Calculate all cast shadow centers for all 6 trees
                const shadows = [];
                if (isDay) {
                    trees.forEach(t => {
                        const dist = Math.abs((t.height) / sunDir.y); // Use tree height to project shadow vector
                        shadows.push({
                            x: t.x + (xPos + sunDir.x * dist - xPos), // Shift from tree base
                            z: t.z + (zPos + sunDir.z * dist - zPos),
                            r: t.canopyRadius
                        });
                    });

                    // Move children into respective shadows
                    runners.forEach(rc => {
                        const t = rc.targetTree;
                        const tDist = Math.abs((t.height) / sunDir.y);
                        // Approximate shadow center for this specific tree
                        const sX = t.x + sunDir.x * tDist;
                        const sZ = t.z + sunDir.z * tDist;

                        // Push them halfway between trunk and shadow tip to stay "deep" in shade
                        const trgX = (t.x + sX) / 2 + rc.offsetX;
                        const trgZ = (t.z + sZ) / 2 + rc.offsetZ;

                        // Simple linear interpolation to make them "run" smoothly towards target rather than snap
                        rc.mesh.position.x += (trgX - rc.mesh.position.x) * 0.1;
                        rc.mesh.position.z += (trgZ - rc.mesh.position.z) * 0.1;
                    });
                }

                // Update Ground Heat Map
                if (groundGeo.attributes.color) {
                    const colors = groundGeo.attributes.color.array;
                    const pos = groundGeo.attributes.position.array;
                    const heatIntensity = Math.sin(angle);

                    for (let i = 0; i < pos.length; i += 3) {
                        const wX = pos[i]; const wZ = pos[i + 1];

                        // Check if vertex is in ANY shadow or under ANY trunk
                        let isCool = false;
                        for (let s of shadows) {
                            const dShadow = Math.sqrt((wX - s.x) * (wX - s.x) + (wZ - s.z) * (wZ - s.z));
                            if (dShadow < s.r * 1.5 && isDay) { isCool = true; break; }
                        }
                        if (!isCool) {
                            for (let t of trees) {
                                const dTrunk = Math.sqrt((wX - t.x) * (wX - t.x) + (wZ - t.z) * (wZ - t.z));
                                if (dTrunk < t.canopyRadius) { isCool = true; break; }
                            }
                        }

                        if (isCool || !isDay) {
                            colors[i] = 0.1; colors[i + 1] = 0.6; colors[i + 2] = 0.3;
                        } else {
                            colors[i] = 1.0; colors[i + 1] = 0.5 - (0.3 * heatIntensity); colors[i + 2] = 0.1;
                        }
                    }
                    groundGeo.attributes.color.needsUpdate = true;
                }
            }
        };
    })();



    // ==========================================
    // SCENE 3: 2025 - 2060 Temporal Projection
    // ==========================================
    const s3 = (function () {
        const container = document.getElementById('canvasContainer3');
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xdcecf8);
        scene.fog = new THREE.Fog(0xdcecf8, 20, 100);

        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(30, 15, 35);
        camera.lookAt(0, 5, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        controls.minDistance = 10; controls.maxDistance = 100;
        controls.target.set(0, 5, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        const sunLight = new THREE.DirectionalLight(0xfffff0, 1.2);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048; sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5; sunLight.shadow.camera.far = 100;
        const d = 35;
        sunLight.shadow.camera.left = -d; sunLight.shadow.camera.right = d;
        sunLight.shadow.camera.top = d; sunLight.shadow.camera.bottom = -d;
        scene.add(sunLight);

        const groundGeo = new THREE.PlaneGeometry(120, 120, 64, 64);
        const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
        scene.add(ground);
        const colors = [];
        for (let i = 0; i < groundGeo.attributes.position.count; i++) { colors.push(1, 0.4, 0); }
        groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        function spawnTree(x, z, h, w, trunkW, tMat, lMats) {
            const grp = new THREE.Group();
            const tGeo = new THREE.CylinderGeometry(trunkW * 0.6, trunkW, h, 8);
            const tr = new THREE.Mesh(tGeo, tMat);
            tr.position.y = h / 2;
            tr.castShadow = true; tr.receiveShadow = true;
            grp.add(tr);

            const folLayers = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < folLayers; i++) {
                const sGeo = new THREE.SphereGeometry(w * (0.6 + Math.random() * 0.4), 12, 12);
                sGeo.scale(1, 0.6 + Math.random() * 0.4, 1);
                const lMat = lMats[Math.floor(Math.random() * lMats.length)];
                const leaf = new THREE.Mesh(sGeo, lMat);
                leaf.position.set((Math.random() - 0.5) * w * 0.5, h + (Math.random() - 0.5) * w * 0.5, (Math.random() - 0.5) * w * 0.5);
                leaf.castShadow = true; leaf.receiveShadow = true;
                grp.add(leaf);
            }
            grp.position.set(x, 0, z);
            scene.add(grp);
            return { mesh: grp, x, z, startCanopyR: w * 1.2, startHeight: h };
        }

        const trees = [];
        trees.push(spawnTree(0, 0, 12, 8, 2.5, trunkMat, [cypressG1, cypressG2, cypressG3]));
        trees.push(spawnTree(14, 8, 8, 11, 3.0, oakTrunkMat, [oakG1, oakG2]));
        trees.push(spawnTree(-12, 10, 10, 5, 1.2, trunkMat, [elmG]));
        trees.push(spawnTree(-8, -14, 6, 4, 0.8, trunkMat, [retamaG]));
        trees.push(spawnTree(15, -10, 7, 6, 1.5, trunkMat, [mesquiteG]));
        trees.push(spawnTree(20, -2, 9, 8, 1.8, trunkMat, [oakG1, cypressG3]));

        // Fix sun position to 2:00 PM constant for temporal analysis
        const hour = 14;
        const pct = (hour - 6) / 12;
        const angle = Math.PI * pct;
        const radius = 50;
        const yPos = Math.sin(angle) * radius;
        const zPos = Math.cos(angle) * radius;
        const xPos = 15;

        sunLight.position.set(xPos, yPos + 5, zPos);
        ambientLight.intensity = 0.2 + (Math.sin(angle) * 0.4);
        sunLight.intensity = 0.5 + (Math.sin(angle) * 0.8);

        return {
            container, scene, camera, renderer, controls, sunLight, ambientLight, groundGeo, trees, sunDirY: 10 - (yPos + 5),

            updateYear: (year) => {
                const yearPct = (year - 2025) / (2060 - 2025); // 0.0 to 1.0 progress
                const scaleMulti = 0.3 + (yearPct * 1.5); // Start at 30% scale, grow to 180%

                // Heat Escalation 
                // 2025 avg max is say ~102
                // 2060 avg max is say ~106 (+4 degrees)
                const baseExposedColorTemp = 0.5 - (yearPct * 0.2); // make asphalt more red as time goes on

                const sunDir = new THREE.Vector3(0 - xPos, 10 - (yPos + 5), 0 - zPos).normalize();

                const shadows = [];
                trees.forEach(t => {
                    t.mesh.scale.set(scaleMulti, scaleMulti, scaleMulti); // physically grow the 3D meshes
                    const curHeight = t.startHeight * scaleMulti;
                    const curRadius = t.startCanopyR * scaleMulti;

                    const dist = Math.abs((curHeight) / sunDir.y);
                    shadows.push({
                        x: t.x + (xPos + sunDir.x * dist - xPos),
                        z: t.z + (zPos + sunDir.z * dist - zPos),
                        r: curRadius
                    });
                });

                if (groundGeo.attributes.color) {
                    const colors = groundGeo.attributes.color.array;
                    const pos = groundGeo.attributes.position.array;

                    for (let i = 0; i < pos.length; i += 3) {
                        const wX = pos[i]; const wZ = pos[i + 1];

                        let isCool = false;
                        for (let s of shadows) {
                            const dShadow = Math.sqrt((wX - s.x) * (wX - s.x) + (wZ - s.z) * (wZ - s.z));
                            if (dShadow < s.r * 1.5) { isCool = true; break; }
                        }
                        if (!isCool) {
                            for (let t of trees) {
                                const dTrunk = Math.sqrt((wX - t.x) * (wX - t.x) + (wZ - t.z) * (wZ - t.z));
                                if (dTrunk < t.startCanopyR * scaleMulti) { isCool = true; break; }
                            }
                        }

                        if (isCool) {
                            // Shade mitigates heat
                            colors[i] = 0.1; colors[i + 1] = 0.6; colors[i + 2] = 0.3;
                        } else {
                            // Exposed asphalt gets hotter as years go by
                            colors[i] = 1.0; colors[i + 1] = baseExposedColorTemp; colors[i + 2] = 0.1;
                        }
                    }
                    groundGeo.attributes.color.needsUpdate = true;
                }
            }
        };
    })();



    // ==========================================
    // GLOBAL TICK CONTROLLER (Scenes 1 & 2)
    // ==========================================

    function updateSunPosition() {
        const hour = parseFloat(sunSlider.value);
        timeDisplay.textContent = formatTime(hour);

        const pct = (hour - 6) / 12;
        const angle = Math.PI * pct;
        const radius = 50;

        // Shared positioning calculations
        const yPos = Math.sin(angle) * radius;
        const zPos = Math.cos(angle) * radius;
        const xPos = 15;

        // Update Temps
        calculateTemps(hour);

        // Update BOTH scenes with new lighting positions
        s1.updateLighting(xPos, yPos, zPos, angle);
        s2.updateLighting(xPos, yPos, zPos, angle);
    }

    // Controls listeners for Daily
    sunSlider.addEventListener('input', () => {
        if (isPlaying) togglePlay();
        updateSunPosition();
    });

    function togglePlay() {
        isPlaying = !isPlaying;
        playBtn.textContent = isPlaying ? "Pause" : "Play";
        playBtn.style.background = isPlaying ? "#d32f2f" : "#2e7d32";

        if (isPlaying) {
            playInterval = setInterval(() => {
                let currentVal = parseFloat(sunSlider.value);
                currentVal += 0.25;
                if (currentVal > 18) currentVal = 6;

                sunSlider.value = currentVal;
                updateSunPosition();
            }, 1000);
        } else {
            clearInterval(playInterval);
        }
    }

    playBtn.addEventListener('click', togglePlay);


    // ==========================================
    // TEMPORAL CONTROLLER & CHART (Scene 3)
    // ==========================================
    const yearSlider = document.getElementById('yearSlider');
    const yearDisplay = document.getElementById('yearDisplay');
    const playYearBtn = document.getElementById('playYearBtn');

    let isPlayingYears = false;
    let yearInterval;

    // Build Temperature Chart
    const ctx = document.getElementById('tempChart').getContext('2d');

    // Generate linear mock data for 2025 - 2060 (36 points)
    const labels = [];
    const baseHeatData = [];
    const mitigatedHeatData = [];

    for (let y = 2025; y <= 2060; y++) {
        labels.push(y);
        const yPct = (y - 2025) / 35;
        // Base heat rises from 102F to 106F
        baseHeatData.push(102 + (yPct * 4));

        // Mitigated heat starts at 98F (small trees) and drops to 90F (large mature canopy)
        mitigatedHeatData.push(98 - (yPct * 8));
    }

    const tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Projected Base Hottest Hour (°F)',
                    borderColor: '#d84315', // Deep orange
                    backgroundColor: 'rgba(216, 67, 21, 0.1)',
                    data: baseHeatData,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0
                },
                {
                    label: 'Mitigated Shade Temp (°F)',
                    borderColor: '#2e7d32', // Dark green
                    backgroundColor: 'rgba(46, 125, 50, 0.2)',
                    data: mitigatedHeatData,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 15
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    min: 80,
                    max: 110
                }
            }
        }
    });

    function updateChartTracer(yearVal) {
        const index = yearVal - 2025;
        tempChart.setActiveElements([
            { datasetIndex: 0, index: index },
            { datasetIndex: 1, index: index }
        ]);
        tempChart.tooltip.setActiveElements([
            { datasetIndex: 0, index: index },
            { datasetIndex: 1, index: index }
        ]);
        tempChart.update();
    }

    function updateYearPosition() {
        const year = parseInt(yearSlider.value);
        yearDisplay.textContent = year;
        s3.updateYear(year);
        updateChartTracer(year);
    }

    yearSlider.addEventListener('input', () => {
        if (isPlayingYears) togglePlayYears();
        updateYearPosition();
    });

    function togglePlayYears() {
        isPlayingYears = !isPlayingYears;
        playYearBtn.textContent = isPlayingYears ? "Pause Timeline" : "Play Timeline";
        playYearBtn.style.background = isPlayingYears ? "#757575" : "#0277bd";

        if (isPlayingYears) {
            yearInterval = setInterval(() => {
                let currentVal = parseInt(yearSlider.value);
                currentVal += 1;
                if (currentVal > 2060) currentVal = 2025; // Loop

                yearSlider.value = currentVal;
                updateYearPosition();
            }, 400); // 400ms per year for cinematic pacing
        } else {
            clearInterval(yearInterval);
        }
    }

    playYearBtn.addEventListener('click', togglePlayYears);


    // Bootstrap
    updateSunPosition();
    updateYearPosition();

    function animate() {
        requestAnimationFrame(animate);

        s1.controls.update();
        s1.renderer.render(s1.scene, s1.camera);

        s2.controls.update();
        s2.renderer.render(s2.scene, s2.camera);

        s3.controls.update();
        s3.renderer.render(s3.scene, s3.camera);
    }
    animate();

    // Window Resize Handler
    window.addEventListener('resize', () => {
        s1.camera.aspect = s1.container.clientWidth / s1.container.clientHeight;
        s1.camera.updateProjectionMatrix();
        s1.renderer.setSize(s1.container.clientWidth, s1.container.clientHeight);

        s2.camera.aspect = s2.container.clientWidth / s2.container.clientHeight;
        s2.camera.updateProjectionMatrix();
        s2.renderer.setSize(s2.container.clientWidth, s2.container.clientHeight);

        s3.camera.aspect = s3.container.clientWidth / s3.container.clientHeight;
        s3.camera.updateProjectionMatrix();
        s3.renderer.setSize(s3.container.clientWidth, s3.container.clientHeight);
    }, false);

    // Auto-start playback on load for wow factor
    togglePlay();
    togglePlayYears();

});
