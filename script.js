document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navList = document.querySelector('.nav-list');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger && navList) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navList.classList.toggle('active');
        });

        // Close mobile menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navList.classList.remove('active');
            });
        });
    }

    // Dynamic Year in Footer
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Scroll Active State
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') && link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Intersection Observer for Section Title Animation
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        observer.observe(title);
    });

    // -------------------------------------------------------------
    // Projects Data Store
    // -------------------------------------------------------------
    const projectsData = {
        'so101-watchdog': {
            title: 'SO-101 Policy Watchdog',
            badge: 'Robotics & Autonomy',
            tags: ['ROS2', 'ACT Policy', 'OpenCV', 'Imitation Learning', 'DS4 Teleop', 'Python'],
            mediaType: 'image',
            mediaSrc: './assets/projects/so101 policy watchdog/so101_watchdog_setup.png',
            mediaAlt: 'SO-101 Policy Watchdog Robot Arm Setup',
            descriptionParagraphs: [
                'A vision-based failure detection and recovery system for robot arm policies, demonstrated on a SO-101 arm.',
                'Trained an ACT (Action Chunking Transformer) imitation learning policy via recorded teleop demonstrations to execute autonomous pick-and-place manipulation tasks.',
                'Built a robust ROS2 architecture around the policy pipeline and layered OpenCV-based failure detection on top. When a grasp or placement failure is detected, the system pauses the autonomous policy and hands control to DS4 controller teleop for human correction before resuming autonomy.'
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
        'lerobot-ds4': {
            title: 'DS4 Teleop for LeRobot (Open Source PR)',
            badge: 'Open Source',
            tags: ['Python', 'LeRobot', 'Hugging Face', 'DualShock 4', 'Teleoperation', 'Robotics'],
            mediaType: 'image',
            mediaSrc: './assets/projects/act+ds4/ds4_lerobot_workspace.png',
            mediaAlt: 'DS4 Teleoperation for LeRobot Workspace',
            descriptionParagraphs: [
                'Contributed a new teleoperator module to the open-source LeRobot library by Hugging Face, enabling a DualShock 4 controller to be used as an alternative to a leader arm for teleoperating LeRobot-based robot arms.',
                'Engineered joystick mapping, safety limits, and real-time command streaming to support responsive arm control.',
                'Provides a highly accessible, low-cost solution for recording demonstration datasets and training imitation learning models without requiring expensive leader arm hardware.'
            ],
            actions: [
                {
                    label: 'LeRobot Teleoperator Contribution (GitHub PR)',
                    url: 'https://github.com/lakshyabajaj14/lerobot/tree/main/src/lerobot/teleoperators/ds4_arm',
                    icon: 'fab fa-github',
                    type: 'external',
                    btnClass: 'primary'
                }
            ]
        },
        'meees-lunar': {
            title: 'MEEES: Lunar Base Tool-Handling System',
            badge: 'CAD & Mechanism Design',
            tags: ['CAD (Onshape)', 'SO-101 Arm', 'Mechanism Design', 'JSON Playback', 'Rapid Prototyping'],
            mediaType: 'image',
            mediaSrc: './assets/projects/MEEES/meees_gripper_cad.png',
            mediaAlt: 'MEEES Bayonet Twist-Lock Gripper CAD Model',
            descriptionParagraphs: [
                'Modified a SO-101 arm with a custom bayonet twist-lock gripper to build a versatile tool-handling system for setting up a moon base.',
                'Designed around 3 interchangeable tools (forklift, shovel, wrench), each with its own modular storage box. The forklift tool could relocate storage boxes to move tools between locations as needed.',
                'Motion was achieved by recording hand-guided encoder positions into JSON files, then stitching sequences of these together via a custom playback program.'
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
        'yamaha-coin-sorter': {
            title: 'Yamaha Pick-and-Place Coin Sorter',
            badge: 'Industrial Automation',
            tags: ['Yamaha Robotics', 'Industrial Automation', 'Proximity Sensors', 'Robot Kinematics'],
            mediaType: 'gif',
            mediaSrc: './assets/projects/yamaha coin sorter/coin_sorter_2x.gif',
            mediaAlt: 'Yamaha Coin Sorter 2x Speed Demo GIF',
            descriptionParagraphs: [
                'Programmed a Yamaha industrial robot arm to sort metal coins between two fixture rows using an inductive metal proximity sensor to detect stop positions.',
                'Implemented precision pick-and-place trajectories, sensor polling logic, and automated coin classification routines.',
                'Demonstrated reliable continuous sorting cycles with real-time feedback verification.'
            ],
            actions: [
                {
                    label: 'Robotic Workcell & Tooling Setup (Photo)',
                    url: './assets/projects/yamaha coin sorter/IMG_3547.JPG',
                    icon: 'fas fa-camera',
                    type: 'image',
                    btnClass: 'secondary'
                }
            ]
        },
        'fanuc-metal-sorter': {
            title: 'Automated Metal Sorter',
            badge: 'Industrial Robotics',
            tags: ['FANUC KAREL', 'Teach Pendant', 'Sensor Integration', 'Industrial Control'],
            mediaType: 'image',
            mediaSrc: './assets/projects/fanuc metal sorter/metal_sorter_robot.jpeg',
            mediaAlt: 'Automated FANUC Metal Sorter Robot',
            descriptionParagraphs: [
                'Designed and programmed an automated robotic system using a FANUC industrial robot to identify and separate metal and non-metal objects.',
                'Integrated an inductive proximity sensor and indicator lights into the robot end effector to classify and sort materials in real time.',
                'Authored robust FANUC KAREL programs and teach pendant routines with error handling and cycle time optimization.'
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
        'hifazat-safety': {
            title: 'Hifazat: Driver Safety System',
            badge: 'Embedded & Vision',
            tags: ['Python', 'OpenCV', 'MediaPipe', 'Arduino', 'GPS/GSM', 'C++'],
            mediaType: 'image',
            mediaSrc: './assets/projects/hifazat/INTRO BANNER HIFAZAT.png',
            mediaAlt: 'Hifazat Driver Safety System Banner',
            descriptionParagraphs: [
                'Developed a comprehensive driver distraction and safety monitoring system leveraging Python, OpenCV, and MediaPipe.',
                'Tracks facial features, eye aspect ratio, and hand gestures in real time to detect lethargy, drowsiness, phone usage, and eating.',
                'Interfaced with an Arduino-based GPS/GSM tracking module to monitor vehicle speed and automatically dispatch SMS alerts with live location data if erratic driving or severe distraction is detected.'
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
        'fretboard-trainer': {
            title: 'Interactive Fretboard Trainer',
            badge: 'Embedded & Hardware',
            tags: ['Embedded Systems', 'C++', '3D Printing', 'CAD', 'Rapid Prototyping'],
            mediaType: 'image',
            mediaSrc: './assets/projects/fret board trainer/fretboard_cover.png',
            mediaAlt: 'Interactive Fretboard Trainer Device',
            descriptionParagraphs: [
                'Developed a portable, interactive stringed instrument trainer designed to keep beginner and young musicians engaged.',
                'Engineered embedded electronics and programmed a responsive LED lighting system that visually guides users on finger placement and scale patterns.',
                'Collaborated on the 3D-printed physical design, resulting in an intuitive, personalized tool for learning an instrument.'
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
        'mars-tacskin': {
            title: 'Undergraduate Researcher: MARS Lab',
            badge: 'Research & Hardware',
            tags: ['KiCad PCB', '16x16 Tactile Array', 'Signal Conditioning', 'PyQtGraph & OpenGL', '3D Force Modeling', 'Python'],
            mediaType: 'image',
            mediaSrc: './assets/projects/MARS Lab_TacSkin/IMG_3104.jpeg',
            mediaAlt: 'MARS Lab 16x16 Tactile Skin Hardware Setup',
            descriptionParagraphs: [
                'Designed schematics and custom PCB in KiCad for a 16x16 piezoresistive tactile array (256 nodes), implementing multiplexed readout and high-speed serial streaming (2 Mbps) for structured force data acquisition.',
                'Developed signal conditioning pipeline including median baseline calibration, per-node thresholding, dynamic range clipping, fixed-scale normalization, and temporal low-pass filtering to improve measurement stability and reduce cross-talk.',
                'Architected multi-threaded real-time visualization system (PyQtGraph + OpenGL) with cubic interpolation (16x16 to 64x64), Gaussian spatial smoothing, and 60 FPS surface rendering.',
                'Extending tactile modeling framework to incorporate shear force estimation alongside normal forces for enhanced 3D force reconstruction in downstream learning-based inference pipelines.'
            ],
            actions: []
        }
    };

    // -------------------------------------------------------------
    // Modal & Lightbox Elements
    // -------------------------------------------------------------
    const projectModal = document.getElementById('project-modal');
    const projectModalClose = document.getElementById('project-modal-close');
    const projectModalMedia = document.getElementById('project-modal-media');
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

    // Helper: Lock / Unlock Body Scroll
    const lockBodyScroll = () => document.body.classList.add('modal-open');
    const unlockBodyScroll = () => {
        if (!projectModal.classList.contains('active') && !mediaLightbox.classList.contains('active')) {
            document.body.classList.remove('modal-open');
        }
    };

    // -------------------------------------------------------------
    // Universal Media Lightbox Functions
    // -------------------------------------------------------------
    const openMediaLightbox = ({ type, url, title = 'Media Preview' }) => {
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
            video.style.maxWidth = '100%';
            video.style.maxHeight = 'calc(94vh - 70px)';
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
                .then(res => res.text())
                .then(text => {
                    code.textContent = text;
                })
                .catch(() => {
                    code.textContent = 'Unable to load code snippet inline. Use the top right icon to open directly.';
                });
        }

        mediaLightbox.classList.add('active');
        lockBodyScroll();
    };

    const closeMediaLightbox = () => {
        mediaLightbox.classList.remove('active');
        // Stop any playing video
        const video = lightboxContent.querySelector('video');
        if (video) {
            video.pause();
            video.src = '';
        }
        lightboxContent.innerHTML = '';
        unlockBodyScroll();
    };

    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeMediaLightbox);
    }

    if (mediaLightbox) {
        mediaLightbox.addEventListener('click', (e) => {
            if (e.target === mediaLightbox) {
                closeMediaLightbox();
            }
        });
    }

    // -------------------------------------------------------------
    // Project Detail Modal Functions
    // -------------------------------------------------------------
    const openProjectModal = (projectId) => {
        const project = projectsData[projectId];
        if (!project) return;

        projectModalTitle.textContent = project.title;

        // Tags
        projectModalTags.innerHTML = '';
        project.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'project-tag';
            span.textContent = tag;
            projectModalTags.appendChild(span);
        });

        // Media Preview
        projectModalMedia.innerHTML = '';
        let mediaEl;
        if (project.mediaType === 'video') {
            mediaEl = document.createElement('video');
            mediaEl.src = project.mediaSrc;
            mediaEl.autoplay = true;
            mediaEl.loop = true;
            mediaEl.muted = true;
            mediaEl.playsInline = true;
        } else {
            mediaEl = document.createElement('img');
            mediaEl.src = project.mediaSrc;
            mediaEl.alt = project.mediaAlt || project.title;
        }
        projectModalMedia.appendChild(mediaEl);

        const expandBadge = document.createElement('div');
        expandBadge.className = 'project-modal-media-badge';
        expandBadge.innerHTML = '<i class="fas fa-expand"></i> Full View';
        expandBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            openMediaLightbox({
                type: project.mediaType,
                url: project.mediaSrc,
                title: project.title
            });
        });
        projectModalMedia.appendChild(expandBadge);

        // Description Paragraphs
        projectModalDesc.innerHTML = '';
        project.descriptionParagraphs.forEach(pText => {
            const p = document.createElement('p');
            p.textContent = pText;
            projectModalDesc.appendChild(p);
        });

        // Actions / Links
        projectModalActions.innerHTML = '';
        if (project.actions && project.actions.length > 0) {
            if (projectModalActionsTitle) projectModalActionsTitle.style.display = 'block';
            projectModalActions.style.display = 'flex';

            project.actions.forEach(action => {
                const btn = document.createElement('a');
                btn.className = `modal-action-btn ${action.btnClass || 'secondary'}`;
                btn.innerHTML = `<i class="${action.icon}"></i> ${action.label}`;

                if (action.type === 'external') {
                    btn.href = action.url;
                    btn.target = '_blank';
                    btn.rel = 'noopener noreferrer';
                } else {
                    btn.href = '#';
                    btn.addEventListener('click', (e) => {
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
        } else {
            if (projectModalActionsTitle) projectModalActionsTitle.style.display = 'none';
            projectModalActions.style.display = 'none';
        }

        projectModal.classList.add('active');
        lockBodyScroll();
    };

    const closeProjectModal = () => {
        projectModal.classList.remove('active');
        unlockBodyScroll();
    };

    if (projectModalClose) {
        projectModalClose.addEventListener('click', closeProjectModal);
    }

    if (projectModal) {
        projectModal.addEventListener('click', (e) => {
            if (e.target === projectModal) {
                closeProjectModal();
            }
        });
    }

    // Attach click handlers to project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const projectId = card.getAttribute('data-project-id');
        card.addEventListener('click', (e) => {
            // Prevent if a link was directly clicked
            if (e.target.closest('a')) return;
            openProjectModal(projectId);
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProjectModal(projectId);
            }
        });
    });

    // Global ESC key to close any active modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (mediaLightbox.classList.contains('active')) {
                closeMediaLightbox();
            } else if (projectModal.classList.contains('active')) {
                closeProjectModal();
            }
        }
    });

    // -------------------------------------------------------------
    // Inline PDF Viewer for Resume (or Direct Download)
    // -------------------------------------------------------------
    const resumeBtn = document.getElementById('hero-resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', (e) => {
            // If user holds cmd/ctrl or wants direct download, allow default;
            // Otherwise open in the sleek in-page PDF viewer
            if (!e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                openMediaLightbox({
                    type: 'pdf',
                    url: './LakshyaBajaj_Resume.pdf',
                    title: 'Lakshya Bajaj - Resume'
                });
            }
        });
    }
});
