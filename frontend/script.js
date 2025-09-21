document.addEventListener('DOMContentLoaded', () => {
    // STATE MANAGEMENT
    let state = {};

    const defaultState = {
        profile: { name: 'Player One', email: '' },
        xp: 0, hp: 100, maxHp: 100, level: 1,
        totalXpEarned: 0,
        loginStreak: 1,
        lastLoginDate: new Date().toISOString(),
        badges: [
            { id: 'xp100', name: 'Novice Adventurer', description: 'Earn 100 total XP', unlocked: false, type: 'xp', value: 100 },
            { id: 'week1', name: 'Week Warrior', description: 'Maintain a 7-day streak', unlocked: false, type: 'streak', value: 7 },
            { id: 'xp500', name: 'Seasoned Quester', description: 'Earn 500 total XP', unlocked: false, type: 'xp', value: 500 },
            { id: 'days30', name: 'Month Marathoner', description: 'Maintain a 30-day streak', unlocked: false, type: 'streak', value: 30 },
            { id: 'xp1000', name: 'XP Grandmaster', description: 'Earn 1000 total XP', unlocked: false, type: 'xp', value: 1000 },
            { id: 'days90', name: 'Habit Hero', description: 'Maintain a 90-day streak', unlocked: false, type: 'streak', value: 90 },
        ],
        tasks: { habits: [], todos: [], weeklyGoals: [], monthlyGoals: [] },
        currentView: 'todos',
        goalTypeToAdd: 'weeklyGoals'
    };

    // DOM ELEMENTS
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');

    const xpBarFill = document.getElementById('xp-bar-fill');
    const xpText = document.getElementById('xp-text');
    const hpBarFill = document.getElementById('hp-bar-fill');
    const hpText = document.getElementById('hp-text');
    const levelText = document.getElementById('level-text');
    const navButtons = document.querySelectorAll('.nav-button');
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const deleteModalContainer = document.getElementById('delete-modal');
    const badgeUnlockModal = document.getElementById('badge-unlock-modal');
    const toastContainer = document.getElementById('toast');
    
    // --- AUTH & DATA PERSISTENCE ---
    function getAllUsers() {
        const users = localStorage.getItem('todoGameUsers');
        return users ? JSON.parse(users) : {};
    }
    
    function saveCurrentUser() {
        if (!state.profile || !state.profile.email) return;
        const users = getAllUsers();
        users[state.profile.email] = state;
        localStorage.setItem('todoGameUsers', JSON.stringify(users));
        localStorage.setItem('todoGameCurrentUser', state.profile.email);
    }

    function handleLogin(email) {
        const users = getAllUsers();
        if (users[email]) {
            state = users[email];
            if (state.badges === undefined) { state.badges = JSON.parse(JSON.stringify(defaultState.badges)); }
            if (state.totalXpEarned === undefined) { state.totalXpEarned = 0; }
            if (state.loginStreak === undefined) { state.loginStreak = 1; }
            if (state.lastLoginDate === undefined) { state.lastLoginDate = state.lastLogin ? new Date(state.lastLogin).toISOString() : new Date().toISOString(); }
            startGame();
        } else {
            alert('No account found with that email.');
        }
    }
    
    function handleSignUp(name, email) {
         const users = getAllUsers();
         if (users[email]) {
             alert('An account with this email already exists.');
             return;
         }
         state = JSON.parse(JSON.stringify(defaultState));
         state.profile.name = name;
         state.profile.email = email;
         startGame();
    }

    function handleLogout() {
        localStorage.removeItem('todoGameCurrentUser');
        state = {};
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        appContainer.classList.remove('flex');
    }

    function startGame() {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        appContainer.classList.add('flex');
        checkDateAndResetTasks();
        updateAllUI();
        renderCurrentView();
        saveCurrentUser();
    }

    // --- HP / XP / LEVEL / BADGES ---
    const XP_PER_LEVEL = 100;
    const XP_PER_TASK = 10;
    const HP_PENALTY = 10;

    function checkBadgeUnlocks() {
        state.badges.forEach(badge => {
            if (!badge.unlocked) {
                let requirementMet = false;
                if (badge.type === 'xp' && state.totalXpEarned >= badge.value) {
                    requirementMet = true;
                } else if (badge.type === 'streak' && state.loginStreak >= badge.value) {
                    requirementMet = true;
                }
                if (requirementMet) {
                    badge.unlocked = true;
                    showBadgeUnlockAnimation(badge);
                }
            }
        });
    }

    function updateXP(amount) {
        state.xp += amount;
        if (amount > 0) {
            state.totalXpEarned += amount;
        } else {
             state.totalXpEarned = Math.max(0, state.totalXpEarned + amount);
        }
        
        checkBadgeUnlocks();
        updateXPBar(); 

        if (state.xp >= XP_PER_LEVEL) {
           setTimeout(() => {
                state.level++;
                state.xp -= XP_PER_LEVEL;
                showToast(`Level Up! Reached Level ${state.level}!`, 'levelup');
                updateLevelUI();
                updateXPBar();
                saveCurrentUser();
           }, 500);
        } else {
            saveCurrentUser();
        }
    }

    function updateHP(amount) {
        state.hp += amount;
        if (state.hp < 0) state.hp = 0;
        if (state.hp > state.maxHp) state.hp = state.maxHp;
        updateHPBar();
        saveCurrentUser();
    }
    
    function updateAllUI() {
        updateXPBar();
        updateHPBar();
        updateLevelUI();
    }

    function updateXPBar() {
        const xpPercentage = (state.xp / XP_PER_LEVEL) * 100;
        xpBarFill.style.width = `${xpPercentage > 100 ? 100 : xpPercentage}%`;
        xpText.textContent = `${state.xp < 0 ? 0 : state.xp}/${XP_PER_LEVEL}`;
    }

    function updateHPBar() {
        const hpPercentage = (state.hp / state.maxHp) * 100;
        hpBarFill.style.width = `${hpPercentage}%`;
        hpText.textContent = `${state.hp}/${state.maxHp}`;
    }

    function updateLevelUI() {
        levelText.textContent = state.level;
    }

    // --- TASK MANAGEMENT ---
    function addTask(title, type) {
        const newTask = {
            id: Date.now(), title, completed: false,
            createdAt: new Date().toISOString()
        };
        if (type === 'habits') state.tasks.habits.push(newTask);
        else if (type === 'weeklyGoals') state.tasks.weeklyGoals.push(newTask);
        else if (type === 'monthlyGoals') state.tasks.monthlyGoals.push(newTask);
        else state.tasks.todos.push(newTask);
        saveCurrentUser();
        renderCurrentView();
    }

    function deleteTask(id, type) {
        if (type === 'habits') state.tasks.habits = state.tasks.habits.filter(t => t.id !== id);
        else if (type === 'weeklyGoals') state.tasks.weeklyGoals = state.tasks.weeklyGoals.filter(t => t.id !== id);
        else if (type === 'monthlyGoals') state.tasks.monthlyGoals = state.tasks.monthlyGoals.filter(t => t.id !== id);
        else state.tasks.todos = state.tasks.todos.filter(t => t.id !== id);
        saveCurrentUser();
        renderCurrentView();
    }
    
    function toggleTask(id, type) {
        let taskList;
        if (type === 'habits') taskList = state.tasks.habits;
        else if (type === 'weeklyGoals') taskList = state.tasks.weeklyGoals;
        else if (type === 'monthlyGoals') taskList = state.tasks.monthlyGoals;
        else taskList = state.tasks.todos;
        
        const task = taskList.find(t => t.id === id);
        if (task) {
            if(type === 'habits' && task.completed) return;
            task.completed = !task.completed;
            if (task.completed) {
                updateXP(XP_PER_TASK);
                showToast(`+${XP_PER_TASK} XP!`);
                showConfettiEffect();
            } else {
                if(type !== 'habits') updateXP(-XP_PER_TASK);
            }
        }
        saveCurrentUser();
        renderCurrentView();
    }

    // --- DATE & RESET LOGIC ---
    function checkDateAndResetTasks() {
        const today = new Date();
        const lastLoginDate = new Date(state.lastLoginDate);

        if (today.toDateString() !== lastLoginDate.toDateString()) {
             const yesterday = new Date();
             yesterday.setDate(today.getDate() - 1);

            if (lastLoginDate.toDateString() === yesterday.toDateString()) {
                state.loginStreak = (state.loginStreak || 1) + 1;
            } else {
                state.loginStreak = 1;
            }
            
            state.tasks.habits.forEach(habit => {
                if (!habit.completed) {
                   updateHP(-HP_PENALTY);
                   showToast(`-${HP_PENALTY} HP for incomplete habit!`, 'error');
                }
                habit.completed = false;
            });

            state.tasks.todos.forEach(todo => {
                if (!todo.completed) {
                    const diffDays = Math.ceil(Math.abs(new Date() - new Date(todo.createdAt)) / (1000 * 60 * 60 * 24));
                    if (diffDays > 1 && !todo.isOverdue) {
                        updateHP(-HP_PENALTY);
                        todo.isOverdue = true;
                        showToast(`-${HP_PENALTY} HP for overdue task!`, 'error');
                    }
                }
            });
            
            state.lastLoginDate = today.toISOString();
            checkBadgeUnlocks();
            saveCurrentUser();
        }
    }

    // --- UI RENDERING ---
    function renderCurrentView() {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const currentPage = document.querySelector(`#page-${state.currentView}`);
        if (currentPage) currentPage.classList.add('active');

        switch (state.currentView) {
            case 'habits':
                renderTaskListView('Daily Habits', state.tasks.habits, 'habits', document.getElementById('page-habits'));
                break;
            case 'todos':
                renderTaskListView('Daily Todos', state.tasks.todos, 'todos', document.getElementById('page-todos'));
                break;
            case 'goals':
                renderGoalsPage(document.getElementById('page-goals'));
                break;
            case 'profile':
                renderProfilePage(document.getElementById('page-profile'));
                break;
        }
    }

    function renderTaskListView(title, tasks, type, container) {
        container.innerHTML = `<h2 class="font-press-start text-2xl mb-6 text-center">${title}</h2>`;
        const list = document.createElement('ul');
        list.className = 'space-y-3';

        if (tasks.length === 0) {
            list.innerHTML = `<li class="text-center text-gray-500 py-4">No tasks yet. Add one below!</li>`;
        } else {
            tasks.forEach(task => {
                const isOverdue = task.isOverdue && !task.completed;
                const li = document.createElement('li');
                li.className = `task-item flex items-center p-3 bg-[#1a1a2e] rounded-none transition duration-200 ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
                li.dataset.id = task.id; li.dataset.type = type;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed;
                checkbox.className = "custom-checkbox cursor-pointer";
                checkbox.addEventListener('change', () => toggleTask(task.id, type));

                const span = document.createElement('span');
                span.textContent = task.title;
                span.className = 'ml-4 flex-grow';

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = `&times;`;
                deleteBtn.className = 'ml-auto text-2xl text-gray-500 hover:text-red-500 font-bold';
                deleteBtn.addEventListener('click', () => showDeleteModal(task.id, type));

                li.append(checkbox, span, deleteBtn);
                list.appendChild(li);
            });
        }
        container.appendChild(list);
    }
    
    function renderGoalsPage(container) {
         container.innerHTML = '';
         const toggleContainer = document.createElement('div');
         toggleContainer.className = 'flex justify-center mb-6 border-2 border-gray-700 w-max mx-auto';
         toggleContainer.innerHTML = `
            <button id="weekly-toggle" class="goal-toggle px-4 py-2">Weekly</button>
            <button id="monthly-toggle" class="goal-toggle px-4 py-2">Monthly</button>
         `;
         container.appendChild(toggleContainer);
         const weeklyToggle = container.querySelector('#weekly-toggle');
         const monthlyToggle = container.querySelector('#monthly-toggle');
         const updateToggleUI = () => {
            weeklyToggle.classList.toggle('active', state.goalTypeToAdd === 'weeklyGoals');
            monthlyToggle.classList.toggle('active', state.goalTypeToAdd === 'monthlyGoals');
         };
         weeklyToggle.onclick = () => { state.goalTypeToAdd = 'weeklyGoals'; updateToggleUI(); };
         monthlyToggle.onclick = () => { state.goalTypeToAdd = 'monthlyGoals'; updateToggleUI(); };
         updateToggleUI();

         const weeklyContainer = document.createElement('div');
         const monthlyContainer = document.createElement('div');
         renderTaskListView('Weekly Targets', state.tasks.weeklyGoals, 'weeklyGoals', weeklyContainer);
         renderTaskListView('Monthly Targets', state.tasks.monthlyGoals, 'monthlyGoals', monthlyContainer);
         container.append(weeklyContainer, Object.assign(document.createElement('hr'), {className: 'my-8 border-gray-700'}), monthlyContainer);
    }
    
    function renderProfilePage(container) {
         const badgeSVG = (unlocked) => `
            <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5V11C4 16.5 7.5 21.5 12 23C16.5 21.5 20 16.5 20 11V5L12 2Z" fill="${unlocked ? '#f59e0b' : '#4a5568'}"/>
                <path d="M12 2L4 5V11C4 16.5 7.5 21.5 12 23" fill="${unlocked ? '#d97706' : '#2d3748'}"/>
                <path d="M12 4L18 7V11C18 15 15.5 18.5 12 20.5V4Z" fill="${unlocked ? '#fbbF24' : '#718096'}"/>
            </svg>
        `;

        container.innerHTML = `
            <h2 class="font-press-start text-2xl mb-6 text-center">Profile</h2>
            <div class="space-y-4 text-lg">
                <div>
                    <label for="profile-name" class="block mb-1 text-sm text-gray-400">Name</label>
                    <input type="text" id="profile-name" value="${state.profile.name}" class="w-full px-4 py-2 bg-[#1a1a2e] text-gray-200 border-2 border-gray-600 focus:outline-none" readonly>
                </div>
                <div>
                    <label for="profile-email" class="block mb-1 text-sm text-gray-400">Email</label>
                    <input type="email" id="profile-email" value="${state.profile.email}" class="w-full px-4 py-2 bg-[#1a1a2e] text-gray-200 border-2 border-gray-600 focus:outline-none" readonly>
                </div>
            </div>
            
            <h3 class="font-press-start text-xl mt-8 mb-4 text-center">Badges</h3>
            <div class="grid grid-cols-3 gap-4 text-center">
                ${state.badges.map(badge => `
                    <div class="p-4 bg-gray-800 flex items-center justify-center pixel-border" title="${badge.name}: ${badge.description} (${badge.unlocked ? 'Unlocked!' : 'Locked'})">
                        ${badgeSVG(badge.unlocked)}
                    </div>
                `).join('')}
            </div>

            <button id="logout-button" class="w-full px-4 py-2 mt-12 text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none pixel-border transition duration-200">Logout</button>
        `;
        container.querySelector('#logout-button').addEventListener('click', handleLogout);
    }

    // --- MODALS & EFFECTS ---
    function showBadgeUnlockAnimation(badge) {
        const badgeSVG = `
            <svg class="w-32 h-32 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5V11C4 16.5 7.5 21.5 12 23C16.5 21.5 20 16.5 20 11V5L12 2Z" fill="#f59e0b"/>
                <path d="M12 2L4 5V11C4 16.5 7.5 21.5 12 23" fill="#d97706"/>
                <path d="M12 4L18 7V11C18 15 15.5 18.5 12 20.5V4Z" fill="#fbbF24"/>
            </svg>
        `;
        badgeUnlockModal.innerHTML = `
            <div class="badge-animation-container text-center">
                <h2 class="font-press-start text-3xl text-yellow-300 mb-4">Badge Unlocked!</h2>
                ${badgeSVG}
                <h3 class="font-press-start text-2xl text-white mt-4">${badge.name}</h3>
                <p class="text-gray-400 mt-2">${badge.description}</p>
            </div>
        `;
        badgeUnlockModal.classList.remove('hidden');
        
        setTimeout(() => {
            badgeUnlockModal.classList.add('hidden');
            badgeUnlockModal.innerHTML = '';
            if (state.currentView === 'profile') {
                renderProfilePage(document.getElementById('page-profile'));
            }
        }, 3500);
    }

    function showConfettiEffect() {
        if (typeof confetti !== 'function') return;
        const duration = 1.5 * 1000, animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
        function randomInRange(min, max) { return Math.random() * (max - min) + min; }
        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
    
    function showToast(message, type = 'success') {
        toastContainer.textContent = message;
        toastContainer.className = `fixed top-5 left-1/2 -translate-x-1/2 text-white px-5 py-3 shadow-xl fade-in pixel-border ${type === 'error' ? 'bg-red-600' : (type === 'levelup' ? 'bg-purple-600' : 'bg-green-600')}`;
        toastContainer.classList.remove('hidden');
        setTimeout(() => {
            toastContainer.classList.add('fade-out');
             setTimeout(() => {
                toastContainer.classList.add('hidden');
                toastContainer.classList.remove('fade-out');
             }, 300);
        }, 2500);
    }

    function showDeleteModal(id, type) {
        deleteModalContainer.classList.remove('hidden');
        deleteModalContainer.innerHTML = `
            <div class="bg-[#16213e] rounded-none shadow-xl p-6 w-full max-w-sm border-2 border-gray-700 pixel-border">
                <h3 class="text-xl font-bold text-white">Delete Task?</h3>
                <p class="mt-2 text-gray-400">This cannot be undone.</p>
                <div class="mt-6 flex justify-end gap-3">
                    <button id="cancel-delete" class="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 pixel-border">Cancel</button>
                    <button id="confirm-delete" class="px-4 py-2 bg-red-600 text-white hover:bg-red-700 pixel-border">Delete</button>
                </div>
            </div>`;
        document.getElementById('confirm-delete').onclick = () => { deleteTask(id, type); hideDeleteModal(); };
        document.getElementById('cancel-delete').onclick = hideDeleteModal;
    }

    function hideDeleteModal() {
        deleteModalContainer.classList.add('fade-out');
        setTimeout(() => {
            deleteModalContainer.classList.add('hidden');
            deleteModalContainer.classList.remove('fade-out');
            deleteModalContainer.innerHTML = '';
        }, 300);
    }

    // --- EVENT LISTENERS ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            state.currentView = button.dataset.view;
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderCurrentView();
        });
    });

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = taskInput.value.trim();
        if (title) {
            let type = state.currentView;
            if (state.currentView === 'goals') type = state.goalTypeToAdd;
            addTask(title, type);
            taskInput.value = '';
        }
    });

    showSignupBtn.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });
     showLoginBtn.addEventListener('click', () => {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        if(email) handleLogin(email);
    });
    
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        if(name && email) handleSignUp(name, email);
    });

    // --- INITIALIZATION ---
    function init() {
        const currentUserEmail = localStorage.getItem('todoGameCurrentUser');
        if (currentUserEmail) {
            handleLogin(currentUserEmail);
        }
    }

    init();
});
