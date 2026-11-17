document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // Theme toggle (paper / blueprint)
    // -------------------------------------------------------------
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    const syncThemeMeta = () => {
        if (themeMeta) {
            themeMeta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
        }
    };
    syncThemeMeta();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try {
                localStorage.setItem('theme', next);
            } catch (e) { /* storage unavailable: theme still applies for this visit */ }
            syncThemeMeta();
            document.dispatchEvent(new CustomEvent('themechange'));
        });
    }

    // -------------------------------------------------------------
    // Mobile menu
    // -------------------------------------------------------------
    const hamburger = document.querySelector('.hamburger');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-link');

    const setMenu = (open) => {
        hamburger.classList.toggle('active', open);
        navList.classList.toggle('active', open);
        hamburger.setAttribute('aria-expanded', String(open));
        hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    if (hamburger && navList) {
        hamburger.addEventListener('click', () => setMenu(!navList.classList.contains('active')));
        navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
    }

    // Footer year
    const yearElement = document.getElementById('year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();

    // -------------------------------------------------------------
    // Active nav link on scroll
    // -------------------------------------------------------------
    const sections = document.querySelectorAll('main section[id]');
    const updateActiveNav = () => {
        const marker = window.scrollY + window.innerHeight * 0.35;
        let current = sections.length ? sections[0].id : '';
        sections.forEach(section => {
            if (section.offsetTop <= marker) current = section.id;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    };
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();

    // -------------------------------------------------------------
    // Reveal on scroll (dimension lines + content blocks)
    // -------------------------------------------------------------
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    const observeReveals = (scope = document) => {
        scope.querySelectorAll('.section-head, .reveal').forEach(node => {
            if (!node.classList.contains('visible')) revealObserver.observe(node);
        });
    };

    // -------------------------------------------------------------
    // Projects data: single source of truth for cards and detail view
    // -------------------------------------------------------------
    const categories = {
        learning: 'Robot learning',
        industrial: 'Industrial',
        mechanical: 'Mechanical',
        embedded: 'Embedded',
        research: 'Research'
    };

    const projects = [
        {
            id: 'so101-watchdog',
            title: 'SO-101 Policy Watchdog',
            category: 'learning',
            featured: true,
            summary: 'A 6-node ROS 2 system that watches an ACT policy with vision, freezes the arm when a grasp fails, and hands control to a DS4 gamepad.',
            tags: ['ROS 2', 'ACT Policy', 'OpenCV', 'Imitation Learning', 'DS4 Teleop', 'Python'],
            mediaType: 'image',
            mediaSrc: './assets/projects/so101 policy watchdog/so101_watchdog_setup.png',
            mediaAlt: 'SO-101 Policy Watchdog robot arm setup',
            descriptionParagraphs: [
                'A vision-based failure detection and recovery system for robot arm policies, demonstrated on a SO-101 arm.',
                'I trained a custom ACT (Action Chunking Transformer) imitation-learning policy for pick-and-place using 50 teleoperated demonstrations across 5 workspace zones.',
                'Around the policy sits a 6-node ROS 2 control system. It detects failures with vision (HSV thresholding), then a supervisor node freezes the arm and hands off to manual DS4 gamepad control so a person can correct the task before autonomy resumes.'
            ],
            actions: [
                {
                    label: 'System Architecture & ROS 2 Repo (GitHub)',
                    url: 'https://github.com/lakshyabajaj14/so101-policy-watchdog',
                    icon: 'fab fa-github',
                    type: 'external',
                    btnClass: 'primary'
                },
                {
                    label: 'ACT Policy Training Pipeline (GitHub)',
                    url: 'https://github.com/lakshyabajaj14/so101-imitation-learning-pickplace',
                    icon: 'fab fa-github',
                    type: 'external',
                    btnClass: 'secondary'
                }
            ]
        },
        {
            id: 'meees-lunar',
            title: 'MEEES: End Effector Exchange System',
            category: 'mechanical',
            summary: 'A bayonet twist-lock tool changer for an SO-101 arm that swaps between forklift, shovel and wrench tools for a moon-base concept.',
            tags: ['Onshape', 'SO-101 Arm', 'Mechanism Design', 'JSON Playback', 'Rapid Prototyping'],
            mediaType: 'image',
            mediaSrc: './assets/projects/MEEES/meees_gripper_cad.png',
            mediaAlt: 'MEEES bayonet twist-lock gripper CAD model',
            descriptionParagraphs: [
                'Co-designed a bayonet twist-lock end effector exchange system in Onshape for an SO-101 arm, built around a moon-base setup concept.',
                'The arm swaps between 3 interchangeable tools (forklift, shovel, wrench), each with its own modular storage box. The forklift tool can relocate the storage boxes to move tools where they are needed.',
                'Motions are programmed by recording motor encoder positions to JSON files while hand-guiding the arm. A sequencer then chains the saved moves in any order.'
            ],
            actions: [
                {
                    label: '3D CAD Model & Assembly (Onshape)',
                    url: 'https://cad.onshape.com/documents/d155e446b225edbc5c4706fe/w/685874816a57e3e96f1aa222/e/04fe1e52fb22881b7a1813af?renderMode=0&uiState=6a9628f396170f3869019a16',
                    icon: 'fas fa-cube',
                    type: 'cad',
                    btnClass: 'primary'
                }
            ]
        },
        {
            id: 'lerobot-ds4',
            title: 'DS4 Teleop for LeRobot',
            category: 'learning',
            summary: 'An open-source pull request to Hugging Face LeRobot that lets a DualShock 4 gamepad stand in for a leader arm.',
            tags: ['Python', 'LeRobot', 'Hugging Face', 'DualShock 4', 'Teleoperation', 'Open Source'],
            mediaType: 'image',
            mediaSrc: './assets/projects/act+ds4/ds4_lerobot_workspace.png',
            mediaAlt: 'DS4 teleoperation workspace for LeRobot',
            descriptionParagraphs: [
                'A new teleoperator module for the open-source LeRobot library by Hugging Face, submitted as PR #3907 (open and awaiting review). It lets a DualShock 4 controller replace a leader arm for teleoperating LeRobot-based robot arms.',
                'I built the joystick mapping, safety limits and real-time command streaming to keep arm control responsive.',
                'The result is a low-cost way to record demonstration datasets and train imitation-learning policies without leader-arm hardware.'
            ],
            actions: [
                {
                    label: 'Pull Request #3907 (GitHub)',
                    url: 'https://github.com/huggingface/lerobot/pull/3907',
                    icon: 'fab fa-github',
                    type: 'external',
                    btnClass: 'primary'
                },
                {
                    label: 'Teleoperator Source (GitHub)',
                    url: 'https://github.com/lakshyabajaj14/lerobot/tree/main/src/lerobot/teleoperators/ds4_arm',
                    icon: 'fab fa-github',
                    type: 'external',
                    btnClass: 'secondary'
                }
            ]
        },
        {
            id: 'little-blazer-engine',
            title: 'Little Blazer Engine',
            category: 'mechanical',
            featured: true,
            summary: 'A full CAD model of a flame-licker engine in Siemens NX: every part modelled, grouped into sub-assemblies, then built into the final assembly.',
            tags: ['Siemens NX', 'Assembly Modelling', 'Sub-assemblies', 'Fasteners'],
            mediaType: 'image',
            mediaSrc: './assets/projects/little-blazer-engine/final_assembly.jpg',
            mediaAlt: 'Final assembly of the Little Blazer engine in Siemens NX',
            gallery: [
                { src: './assets/projects/little-blazer-engine/final_assembly.jpg', alt: 'Final assembly' },
                { src: './assets/projects/little-blazer-engine/frame_cylinder_subassembly.jpg', alt: 'Cylinder and frame sub-assembly' },
                { src: './assets/projects/little-blazer-engine/valve_linkage_subassembly.jpg', alt: 'Valve linkage sub-assembly' }
            ],
            descriptionParagraphs: [
                'A complete CAD model of the Little Blazer flame-licker engine, built in Siemens NX for my CAD class.',
                'I modelled every part individually, from the finned cylinder and flywheel to the valve spring and burner, then grouped them into sub-assemblies such as the cylinder and frame and the valve linkage.',
                'The sub-assemblies were then constrained into the final assembly with the correct fasteners, including socket head cap screws, set screws and nuts.'
            ],
            actions: []
        },
        {
            id: 'fanuc-metal-sorter',
            title: 'FANUC Metal Sorter',
            category: 'industrial',
            summary: 'A FANUC workcell that tells metal from non-metal parts with a sensor on the end effector and sorts them in real time.',
            tags: ['FANUC KAREL', 'Teach Pendant', 'Sensor Integration', 'Industrial Control'],
            mediaType: 'image',
            mediaSrc: './assets/projects/fanuc metal sorter/metal_sorter_robot.jpeg',
            mediaAlt: 'FANUC metal sorter robot',
            descriptionParagraphs: [
                'Designed and programmed an automated robotic system using a FANUC industrial robot to identify and separate metal and non-metal objects.',
                'An inductive proximity sensor and indicator lights are integrated into the end effector to classify and sort materials in real time.',
                'Written as FANUC KAREL programs and teach pendant routines, with error handling and cycle time optimization.'
            ],
            actions: [
                {
                    label: 'Engineering Lab Report (PDF)',
                    url: './assets/projects/fanuc metal sorter/fanuc_report.pdf',
                    icon: 'fas fa-file-pdf',
                    type: 'pdf',
                    btnClass: 'primary'
                },
                {
                    label: 'FANUC KAREL Source Code',
                    url: './assets/projects/fanuc metal sorter/metal_sorter_code.txt',
                    icon: 'fas fa-code',
                    type: 'code',
                    btnClass: 'secondary'
                }
            ]
        },
        {
            id: 'yamaha-coin-sorter',
            title: 'Yamaha Coin Sorter',
            category: 'industrial',
            featured: true,
            summary: 'A Yamaha industrial arm that sorts metal coins between two fixture rows, gated by an inductive proximity sensor.',
            tags: ['Yamaha Robot Language', 'Industrial Automation', 'Proximity Sensors', 'Kinematics'],
            mediaType: 'gif',
            mediaSrc: './assets/projects/yamaha coin sorter/coin_sorter_2x.gif',
            thumb: './assets/projects/yamaha coin sorter/IMG_3547.JPG',
            mediaAlt: 'Yamaha coin sorter running at 2x speed',
            descriptionParagraphs: [
                'Programmed a Yamaha industrial robot arm to sort metal coins between two fixture rows, using an inductive metal proximity sensor to detect stop positions.',
                'Implemented the pick-and-place trajectories, sensor polling logic and coin classification routines.',
                'The cell runs continuous sorting cycles with real-time feedback verification.'
            ],
            actions: []
        },
        {
            id: 'hifazat-safety',
            title: 'Hifazat: Driver Safety System',
            category: 'embedded',
            summary: 'Real-time driver distraction and fatigue monitoring with OpenCV and MediaPipe, plus an Arduino GPS/GSM module for SMS alerts.',
            tags: ['Python', 'OpenCV', 'MediaPipe', 'Arduino', 'GPS/GSM', 'C++'],
            mediaType: 'image',
            mediaSrc: './assets/projects/hifazat/INTRO BANNER HIFAZAT.png',
            mediaAlt: 'Hifazat driver safety system banner',
            descriptionParagraphs: [
                'A driver distraction and safety monitoring system built with Python, OpenCV and MediaPipe.',
                'It tracks facial features, eye aspect ratio and hand gestures in real time to detect drowsiness, phone use and eating.',
                'An Arduino-based GPS/GSM module monitors vehicle speed and sends SMS alerts with live location when erratic driving or severe distraction is detected.'
            ],
            actions: [
                {
                    label: 'Driver Safety System Repo (GitHub)',
                    url: 'https://github.com/lakshyabajaj14/Hifazat',
                    icon: 'fab fa-github',
                    type: 'external',
                    btnClass: 'primary'
                },
                {
                    label: 'Live System Demonstration (Video)',
                    url: './assets/projects/hifazat/Hifazat media vid final.mp4',
                    icon: 'fas fa-video',
                    type: 'video',
                    btnClass: 'secondary'
                },
                {
                    label: 'Technical Presentation (YouTube)',
                    url: 'https://youtu.be/xJdPdNdqZVc',
                    icon: 'fab fa-youtube',
                    type: 'external',
                    btnClass: 'secondary'
                },
                {
                    label: 'Colloquium Slide Deck',
                    url: 'https://view.officeapps.live.com/op/view.aspx?src=https://lakshyabajaj14.github.io/assets/projects/hifazat/COLLOQUIUM FINAL.pptx',
                    icon: 'fas fa-file-powerpoint',
                    type: 'iframe',
                    btnClass: 'secondary'
                }
            ]
        },
        {
            id: 'fretboard-trainer',
            title: 'Interactive Fretboard Trainer',
            category: 'embedded',
            summary: 'A portable instrument trainer with LED finger guidance and embedded electronics in a custom 3D-printed enclosure.',
            tags: ['Embedded Systems', 'C++', '3D Printing', 'CAD', 'Rapid Prototyping'],
            mediaType: 'image',
            mediaSrc: './assets/projects/fret board trainer/fretboard_cover.png',
            mediaAlt: 'Interactive fretboard trainer device',
            descriptionParagraphs: [
                'A portable, interactive stringed instrument trainer designed to keep beginner and young musicians engaged.',
                'I engineered the embedded electronics and programmed a responsive LED system that shows finger placement and scale patterns.',
                'The team collaborated on the 3D-printed physical design to make it an intuitive, personal learning tool.'
            ],
            actions: [
                {
                    label: 'Engineering Design Journal (PDF)',
                    url: './assets/projects/fret board trainer/Group01_35_P03.pdf',
                    icon: 'fas fa-file-pdf',
                    type: 'pdf',
                    btnClass: 'primary'
                },
                {
                    label: 'Enclosure CAD & Schematics (PDF)',
                    url: './assets/projects/fret board trainer/cad_design.pdf',
                    icon: 'fas fa-file-pdf',
                    type: 'pdf',
                    btnClass: 'secondary'
                },
                {
                    label: 'Project Presentation Deck',
                    url: 'https://view.officeapps.live.com/op/view.aspx?src=https://lakshyabajaj14.github.io/assets/projects/fret board trainer/Group 1 Final Presentation.pptx',
                    icon: 'fas fa-file-powerpoint',
                    type: 'iframe',
                    btnClass: 'secondary'
                }
            ]
        },
        {
            // Shown from the Experience section, not the project index
            id: 'mars-tacskin',
            title: 'MARS Lab: 16×16 Tactile Skin',
            category: 'research',
            hidden: true,
            summary: 'Custom PCB, signal conditioning and real-time visualization for a 256-node piezoresistive tactile array.',
            tags: ['KiCad PCB', '16×16 Tactile Array', 'Signal Conditioning', 'PyQtGraph & OpenGL', 'Python'],
            mediaType: 'image',
            mediaSrc: './assets/projects/MARS Lab_TacSkin/IMG_3104.jpeg',
            mediaAlt: 'MARS Lab 16x16 tactile skin hardware setup',
            descriptionParagraphs: [
                'Designed the schematics and a custom PCB in KiCad for a 16×16 piezoresistive tactile array (256 nodes), with multiplexed readout and high-speed serial streaming (2 Mbps) for structured force data.',
                'Built a signal conditioning pipeline with median baseline calibration, per-node thresholding, dynamic range clipping, fixed-scale normalization and temporal low-pass filtering to improve stability and reduce cross-talk.',
                'Architected a multi-threaded real-time visualization system (PyQtGraph + OpenGL) with cubic interpolation (16×16 to 64×64), Gaussian spatial smoothing and 60 FPS surface rendering.'
            ],
            actions: []
        }
    ];

    const projectsById = Object.fromEntries(projects.map(p => [p.id, p]));
    // Featured projects lead, so their numbers run P-01, P-02, P-03
    const listed = projects.filter(p => !p.hidden).sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    listed.forEach((p, i) => { p.no = `P-${String(i + 1).padStart(2, '0')}`; });

    // -------------------------------------------------------------
    // Modal & lightbox elements
    // -------------------------------------------------------------
    const projectModal = document.getElementById('project-modal');
    const projectModalClose = document.getElementById('project-modal-close');
    const projectModalLabel = document.getElementById('project-modal-label');
    const projectModalMedia = document.getElementById('project-modal-media');
    const projectModalGallery = document.getElementById('project-modal-gallery');
    const projectModalTitle = document.getElementById('project-modal-title');
    const projectModalTags = document.getElementById('project-modal-tags');
    const projectModalDesc = document.getElementById('project-modal-desc');
    const projectModalActions = document.getElementById('project-modal-actions');
    const projectModalActionsTitle = document.getElementById('project-modal-actions-title');

    const mediaLightbox = document.getElementById('media-lightbox');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxContent = document.getElementById('lightbox-content');
    const lightboxExternalLink = document.getElementById('lightbox-external-link');

    let lastFocused = null;

    const lockBodyScroll = () => document.body.classList.add('modal-open');
    const unlockBodyScroll = () => {
        if (!projectModal.classList.contains('active') && !mediaLightbox.classList.contains('active')) {
            document.body.classList.remove('modal-open');
        }
    };

    // -------------------------------------------------------------
    // Media lightbox
    // -------------------------------------------------------------
    const openMediaLightbox = ({ type, url, title = 'Media preview' }) => {
        lightboxTitle.textContent = title;
        lightboxContent.innerHTML = '';
        lightboxExternalLink.href = url;

        if (type === 'image' || type === 'gif') {
            const img = document.createElement('img');
            img.src = url;
            img.alt = title;
            lightboxContent.appendChild(img);
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = url;
            video.controls = true;
            video.autoplay = true;
            video.playsInline = true;
            lightboxContent.appendChild(video);
        } else if (type === 'pdf' || type === 'cad' || type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.title = title;
            iframe.setAttribute('allowfullscreen', 'true');
            lightboxContent.appendChild(iframe);
        } else if (type === 'code') {
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = 'Loading code...';
            pre.appendChild(code);
            lightboxContent.appendChild(pre);

            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.text();
                })
                .then(text => { code.textContent = text; })
                .catch(() => {
                    code.textContent = 'Unable to load the code inline. Use the icon at the top right to open it directly.';
                });
        }

        mediaLightbox.classList.add('active');
        lockBodyScroll();
        lightboxClose.focus();
    };

    const closeMediaLightbox = () => {
        mediaLightbox.classList.remove('active');
        const video = lightboxContent.querySelector('video');
        if (video) {
            video.pause();
            video.removeAttribute('src');
        }
        lightboxContent.innerHTML = '';
        unlockBodyScroll();
        if (projectModal.classList.contains('active')) {
            projectModalClose.focus();
        } else if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    };

    lightboxClose.addEventListener('click', closeMediaLightbox);
    mediaLightbox.addEventListener('click', (e) => {
        if (e.target === mediaLightbox) closeMediaLightbox();
    });

    // -------------------------------------------------------------
    // Project detail modal
    // -------------------------------------------------------------
    const renderTags = (container, tags) => {
        container.innerHTML = '';
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'project-tag';
            span.textContent = tag;
            container.appendChild(span);
        });
    };

    const showModalMedia = (project, media) => {
        projectModalMedia.innerHTML = '';
        let mediaEl;
        if (media.type === 'video') {
            mediaEl = document.createElement('video');
            mediaEl.src = media.src;
            mediaEl.autoplay = true;
            mediaEl.loop = true;
            mediaEl.muted = true;
            mediaEl.playsInline = true;
        } else {
            mediaEl = document.createElement('img');
            mediaEl.src = media.src;
            mediaEl.alt = media.alt || project.title;
        }
        projectModalMedia.appendChild(mediaEl);

        const expandBadge = document.createElement('button');
        expandBadge.type = 'button';
        expandBadge.className = 'project-modal-media-badge';
        expandBadge.innerHTML = '<i class="fas fa-expand" aria-hidden="true"></i> Full view';
        expandBadge.addEventListener('click', () => {
            openMediaLightbox({
                type: media.type,
                url: media.src,
                title: media.alt ? `${project.title} - ${media.alt}` : project.title
            });
        });
        projectModalMedia.appendChild(expandBadge);
    };

    const openProjectModal = (projectId) => {
        const project = projectsById[projectId];
        if (!project) return;

        lastFocused = document.activeElement;
        projectModalTitle.textContent = project.title;
        projectModalLabel.textContent = ['Detail view', project.no, categories[project.category]].filter(Boolean).join(' · ');
        renderTags(projectModalTags, project.tags);

        // Main media + optional gallery strip
        showModalMedia(project, { type: project.mediaType, src: project.mediaSrc, alt: project.mediaAlt });
        projectModalGallery.innerHTML = '';
        const gallery = project.gallery || [];
        projectModalGallery.classList.toggle('has-items', gallery.length > 1);
        if (gallery.length > 1) {
            gallery.forEach((item, index) => {
                const thumb = document.createElement('button');
                thumb.type = 'button';
                thumb.className = 'gallery-thumb';
                thumb.setAttribute('aria-label', `Show ${item.alt}`);
                thumb.setAttribute('aria-current', String(index === 0));
                const img = document.createElement('img');
                img.src = item.src;
                img.alt = '';
                thumb.appendChild(img);
                thumb.addEventListener('click', () => {
                    projectModalGallery.querySelectorAll('.gallery-thumb').forEach(t => t.setAttribute('aria-current', 'false'));
                    thumb.setAttribute('aria-current', 'true');
                    showModalMedia(project, { type: 'image', src: item.src, alt: item.alt });
                });
                projectModalGallery.appendChild(thumb);
            });
        }

        // Description
        projectModalDesc.innerHTML = '';
        project.descriptionParagraphs.forEach(pText => {
            const p = document.createElement('p');
            p.textContent = pText;
            projectModalDesc.appendChild(p);
        });

        // Resource links
        projectModalActions.innerHTML = '';
        const hasActions = project.actions && project.actions.length > 0;
        projectModalActionsTitle.style.display = hasActions ? 'block' : 'none';
        projectModalActions.style.display = hasActions ? 'flex' : 'none';
        if (hasActions) {
            project.actions.forEach(action => {
                const btn = document.createElement('a');
                btn.className = `modal-action-btn ${action.btnClass || 'secondary'}`;
                btn.innerHTML = `<i class="${action.icon}" aria-hidden="true"></i> `;
                btn.appendChild(document.createTextNode(action.label));

                if (action.type === 'external') {
                    btn.href = action.url;
                    btn.target = '_blank';
                    btn.rel = 'noopener noreferrer';
                } else {
                    btn.href = action.url;
                    btn.addEventListener('click', (e) => {
                        if (e.metaKey || e.ctrlKey) return;
                        e.preventDefault();
                        openMediaLightbox({
                            type: action.type,
                            url: action.url,
                            title: `${project.title} - ${action.label}`
                        });
                    });
                }
                projectModalActions.appendChild(btn);
            });
        }

        projectModal.querySelector('.modal-container').scrollTop = 0;
        projectModal.classList.add('active');
        lockBodyScroll();
        projectModalClose.focus();
    };

    const closeProjectModal = () => {
        projectModal.classList.remove('active');
        projectModalMedia.innerHTML = '';
        unlockBodyScroll();
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    };

    projectModalClose.addEventListener('click', closeProjectModal);
    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) closeProjectModal();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (mediaLightbox.classList.contains('active')) {
            closeMediaLightbox();
        } else if (projectModal.classList.contains('active')) {
            closeProjectModal();
        }
    });

    // Any element with data-project-id outside the grids (e.g. Experience) opens the detail view
    document.querySelectorAll('.link-btn[data-project-id]').forEach(btn => {
        btn.addEventListener('click', () => openProjectModal(btn.dataset.projectId));
    });

    // -------------------------------------------------------------
    // Project cards + filters
    // -------------------------------------------------------------
    const featuredWrap = document.getElementById('projects-featured');
    const indexWrap = document.getElementById('projects-index');
    const indexLabel = document.getElementById('projects-index-label');
    const filtersWrap = document.getElementById('project-filters');

    const createCard = (project, { compact = false, order = 0 } = {}) => {
        const card = document.createElement('article');
        card.className = `project-card reveal${compact ? ' compact' : ''}`;
        card.style.setProperty('--i', order);
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-haspopup', 'dialog');
        card.setAttribute('aria-label', `Open ${project.title} details`);

        const imgWrap = document.createElement('div');
        imgWrap.className = 'project-img';
        const img = document.createElement('img');
        img.src = project.thumb || project.mediaSrc;
        img.alt = '';
        img.loading = 'lazy';
        imgWrap.appendChild(img);

        const info = document.createElement('div');
        info.className = 'project-info';

        const kicker = document.createElement('div');
        kicker.className = 'project-kicker label';
        const no = document.createElement('span');
        no.className = 'no';
        no.textContent = project.no;
        const cat = document.createElement('span');
        cat.textContent = categories[project.category];
        kicker.append(no, cat);

        const title = document.createElement('h3');
        title.className = 'project-title';
        title.textContent = project.title;

        const desc = document.createElement('p');
        desc.className = 'project-desc';
        desc.textContent = project.summary;

        info.append(kicker, title, desc);

        if (!compact) {
            const tags = document.createElement('div');
            tags.className = 'tags';
            renderTags(tags, project.tags.slice(0, 4));
            const open = document.createElement('div');
            open.className = 'project-open';
            open.innerHTML = '<span>Open detail</span><i class="fas fa-arrow-right" aria-hidden="true"></i>';
            info.append(tags, open);
        }

        card.append(imgWrap, info);
        card.addEventListener('click', () => openProjectModal(project.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProjectModal(project.id);
            }
        });
        return card;
    };

    const renderProjects = (filter) => {
        featuredWrap.innerHTML = '';
        indexWrap.innerHTML = '';
        const isAll = filter === 'all';

        const big = isAll ? listed.filter(p => p.featured) : listed.filter(p => p.category === filter);
        const small = isAll ? listed.filter(p => !p.featured) : [];

        big.forEach((p, i) => featuredWrap.appendChild(createCard(p, { order: i })));
        small.forEach((p, i) => indexWrap.appendChild(createCard(p, { compact: true, order: i })));

        featuredWrap.classList.toggle('is-filtered', !isAll);
        indexLabel.hidden = small.length === 0;
        indexWrap.hidden = small.length === 0;
        observeReveals(featuredWrap);
        observeReveals(indexWrap);
    };

    const renderFilters = () => {
        const used = ['learning', 'industrial', 'mechanical', 'embedded'].filter(key => listed.some(p => p.category === key));
        const options = [{ key: 'all', label: 'All', count: listed.length }]
            .concat(used.map(key => ({ key, label: categories[key], count: listed.filter(p => p.category === key).length })));

        options.forEach(option => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'filter-chip';
            chip.setAttribute('aria-pressed', String(option.key === 'all'));
            chip.textContent = option.label;
            const count = document.createElement('span');
            count.className = 'count';
            count.textContent = option.count;
            chip.appendChild(count);
            chip.addEventListener('click', () => {
                filtersWrap.querySelectorAll('.filter-chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
                chip.setAttribute('aria-pressed', 'true');
                renderProjects(option.key);
            });
            filtersWrap.appendChild(chip);
        });
    };

    if (featuredWrap && indexWrap && filtersWrap) {
        renderFilters();
        renderProjects('all');
    }
    observeReveals();

    // -------------------------------------------------------------
    // Resume: open in the in-page viewer (cmd/ctrl-click opens the file directly)
    // -------------------------------------------------------------
    const resumeBtn = document.getElementById('hero-resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', (e) => {
            if (e.metaKey || e.ctrlKey) return;
            e.preventDefault();
            lastFocused = resumeBtn;
            openMediaLightbox({
                type: 'pdf',
                url: './LakshyaBajaj_Resume.pdf',
                title: 'Lakshya Bajaj - Resume'
            });
        });
    }
});
