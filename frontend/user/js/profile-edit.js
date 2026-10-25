// =========================================
// ENHANCED CYBERPUNK PROFILE EDIT MODAL
// =========================================

// Available avatars
const AVATAR_OPTIONS = [
  { id: 'hooded', name: 'Hooded Figure', emoji: '🥷' },
  { id: 'fawkes', name: 'Guy Fawkes', emoji: '🎭' },
  { id: 'matrix', name: 'Matrix Code', emoji: '💻' },
  { id: 'robot', name: 'Robot', emoji: '🤖' },
  { id: 'terminal', name: 'Terminal', emoji: '⌨️' },
  { id: 'skull', name: 'Skull', emoji: '💀' }
];

// Available skills
const SKILLS = [
  'Python', 'JavaScript', 'Network Security', 'Web Exploitation',
  'Cryptography', 'Linux', 'Reverse Engineering', 'OSINT'
];

// Theme presets
const THEME_PRESETS = [
  { id: 'cyan', name: 'Terminal Green', color: '#00ffbf' },
  { id: 'red', name: 'Error Red', color: '#ff3333' },
  { id: 'blue', name: 'Cyber Blue', color: '#00d2ff' },
  { id: 'orange', name: 'Warning Orange', color: '#ffcc00' }
];

// Profile state
let profileData = {
  username: '',
  email: '',
  avatar: 'default',
  bio: '',
  github_url: '',
  portfolio_url: '',
  htb_profile: '',
  thm_profile: '',
  skills: [],
  theme_color: '#00ffbf',
  country: '',
  hacker_title: '',
  twitter_url: '',
  linkedin_url: ''
};

function openEditProfileModal(user) {
  // Initialize profile data
  profileData = {
    username: user.username || '',
    email: user.email || '',
    avatar: user.avatar || 'hooded',
    bio: user.bio || '',
    github_url: user.github_url || '',
    portfolio_url: user.portfolio_url || '',
    htb_profile: user.htb_profile || '',
    thm_profile: user.thm_profile || '',
    skills: user.skills ? (typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills) : [],
    theme_color: user.theme_color || '#00ffbf',
    country: user.country || '',
    hacker_title: user.hacker_title || '',
    twitter_url: user.twitter_url || '',
    linkedin_url: user.linkedin_url || ''
  };

  const modalHTML = `
    <div class="enhanced-modal-overlay" id="editProfileModal">
      <div class="enhanced-modal-box">
        <div class="enhanced-modal-header">
          <h3 class="enhanced-modal-title">⚡ Digital Identity Configuration</h3>
          <button class="enhanced-close-btn" onclick="closeEditProfileModal()">×</button>
        </div>
        
        <div class="enhanced-modal-body">
          
          <!-- Basic Info -->
          <div class="profile-section">
            <div class="section-label">
              <i class="fas fa-user-circle"></i>
              Basic Information
            </div>
            <div style="display: grid; gap: 15px;">
              <div>
                <input type="text" class="enhanced-input" id="edit-username" 
                       placeholder="Enter username" value="${profileData.username}" />
              </div>
              <div>
                <input type="email" class="enhanced-input" id="edit-email" 
                       placeholder="Enter email" value="${profileData.email}" />
              </div>
              <div>
                <input type="text" class="enhanced-input" id="edit-hacker-title"
                       placeholder="Hacker title (e.g. Ghost Operator)" value="${profileData.hacker_title}" />
              </div>
              <div>
                <input type="text" class="enhanced-input" id="edit-country"
                       placeholder="Country / Location" value="${profileData.country}" />
              </div>
            </div>
          </div>

          <!-- Avatar Selection -->
          <div class="profile-section">
            <div class="section-label">
              <i class="fas fa-mask"></i>
              Avatar / Digital Persona
            </div>
            <div class="avatar-grid">
              ${AVATAR_OPTIONS.map(avatar => `
                <div class="avatar-option ${profileData.avatar === avatar.id ? 'active' : ''}" 
                     data-avatar="${avatar.id}"
                     onclick="selectAvatar('${avatar.id}')">
                  <div style="font-size: 3rem; display: flex; align-items: center; justify-content: center; height: 100%;">
                    ${avatar.emoji}
                  </div>
                </div>
              `).join('')}
              <div class="avatar-option custom-avatar-upload" onclick="document.getElementById('custom-avatar-input').click()">
                <input type="file" id="custom-avatar-input" accept="image/*" onchange="handleCustomAvatar(event)" />
                <div class="upload-label">
                  <i class="fas fa-upload"></i>
                  Custom
                </div>
              </div>
            </div>
          </div>

          <!-- Bio / Manifesto -->
          <div class="profile-section">
            <div class="section-label">
              <i class="fas fa-terminal"></i>
              Hacker Manifesto / Status
            </div>
            <textarea class="enhanced-textarea" id="edit-bio" 
                      placeholder="Enter your digital manifesto... (e.g., 'Exploring the matrix', 'System compromised')" 
                      maxlength="200" 
                      oninput="updateCharCount()">${profileData.bio}</textarea>
            <div class="char-count" id="bio-char-count">0 / 200</div>
          </div>

          <!-- Social / Portfolio Links -->
          <div class="profile-section">
            <div class="section-label">
              <i class="fas fa-link"></i>
              Network Links
            </div>
            <div class="social-links-grid">
              <div class="input-with-icon">
                <i class="fab fa-github"></i>
                <input type="url" class="enhanced-input" id="edit-github" 
                       placeholder="https://github.com/username" 
                       value="${profileData.github_url}" />
              </div>
              <div class="input-with-icon">
                <i class="fas fa-globe"></i>
                <input type="url" class="enhanced-input" id="edit-portfolio" 
                       placeholder="https://yourportfolio.com" 
                       value="${profileData.portfolio_url}" />
              </div>
              <div class="input-with-icon">
                <i class="fab fa-x-twitter"></i>
                <input type="url" class="enhanced-input" id="edit-twitter"
                       placeholder="https://twitter.com/username"
                       value="${profileData.twitter_url}" />
              </div>
              <div class="input-with-icon">
                <i class="fab fa-linkedin"></i>
                <input type="url" class="enhanced-input" id="edit-linkedin"
                       placeholder="https://linkedin.com/in/username"
                       value="${profileData.linkedin_url}" />
              </div>
              <div class="input-with-icon">
                <i class="fas fa-cube"></i>
                <input type="text" class="enhanced-input" id="edit-htb" 
                       placeholder="HackTheBox Username" 
                       value="${profileData.htb_profile}" />
              </div>
              <div class="input-with-icon">
                <i class="fas fa-flag"></i>
                <input type="text" class="enhanced-input" id="edit-thm" 
                       placeholder="TryHackMe Username" 
                       value="${profileData.thm_profile}" />
              </div>
            </div>
          </div>

          <!-- Skill Tags -->
          <div class="profile-section">
            <div class="section-label">
              <i class="fas fa-code"></i>
              Skill Matrix
            </div>
            <div class="skill-tags-container">
              ${SKILLS.map(skill => `
                <div class="skill-tag ${profileData.skills.includes(skill) ? 'active' : ''}" 
                     data-skill="${skill}"
                     onclick="toggleSkill('${skill}')">
                  ${skill}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Theme Picker -->
          <div class="profile-section">
            <div class="section-label">
              <i class="fas fa-palette"></i>
              Theme Accent Color
            </div>
            <div class="theme-picker-container">
              ${THEME_PRESETS.map(theme => `
                <div class="color-preset ${profileData.theme_color === theme.color ? 'active' : ''}" 
                     style="background: ${theme.color};"
                     data-color="${theme.color}"
                     title="${theme.name}"
                     onclick="selectThemeColor('${theme.color}')">
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <div class="enhanced-modal-footer">
          <button class="enhanced-btn-cancel" onclick="closeEditProfileModal()">Cancel</button>
          <button class="enhanced-btn-save" onclick="saveEnhancedProfileChanges()">
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Initialize character count
  updateCharCount();
}

function closeEditProfileModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) modal.remove();
}

// Avatar selection
function selectAvatar(avatarId) {
  profileData.avatar = avatarId;

  // Update UI
  document.querySelectorAll('.avatar-option').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelector(`[data-avatar="${avatarId}"]`).classList.add('active');
}

function handleCustomAvatar(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      profileData.avatar = e.target.result; // Store base64 image
      alert('✅ Custom avatar uploaded! (Will be saved with profile)');
    };
    reader.readAsDataURL(file);
  }
}

// Bio character count
function updateCharCount() {
  const textarea = document.getElementById('edit-bio');
  const counter = document.getElementById('bio-char-count');
  if (textarea && counter) {
    const length = textarea.value.length;
    counter.textContent = `${length} / 200`;

    if (length > 180) counter.classList.add('danger');
    else if (length > 150) counter.classList.add('warning');
    else {
      counter.classList.remove('warning', 'danger');
    }
  }
}

// Skill tag toggle
function toggleSkill(skill) {
  const index = profileData.skills.indexOf(skill);
  if (index > -1) {
    profileData.skills.splice(index, 1);
  } else {
    profileData.skills.push(skill);
  }

  // Update UI
  const tag = document.querySelector(`[data-skill="${skill}"]`);
  tag.classList.toggle('active');
}

// Theme color selection
function selectThemeColor(color) {
  profileData.theme_color = color;

  // Update UI
  document.querySelectorAll('.color-preset').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelector(`[data-color="${color}"]`).classList.add('active');

  // Apply theme immediately for preview
  if (typeof applyThemeColor === 'function') {
    applyThemeColor(color);
  }
}

async function saveEnhancedProfileChanges() {
  const user = JSON.parse(localStorage.getItem("user"));

  // Get values from inputs
  profileData.username = document.getElementById('edit-username').value.trim();
  profileData.email = document.getElementById('edit-email').value.trim();
  profileData.bio = document.getElementById('edit-bio').value.trim();
  profileData.github_url = document.getElementById('edit-github').value.trim();
  profileData.portfolio_url = document.getElementById('edit-portfolio').value.trim();
  profileData.htb_profile = document.getElementById('edit-htb').value.trim();
  profileData.thm_profile = document.getElementById('edit-thm').value.trim();
  profileData.hacker_title = (document.getElementById('edit-hacker-title')?.value || '').trim();
  profileData.country = (document.getElementById('edit-country')?.value || '').trim();
  profileData.twitter_url = (document.getElementById('edit-twitter')?.value || '').trim();
  profileData.linkedin_url = (document.getElementById('edit-linkedin')?.value || '').trim();

  if (!profileData.username || !profileData.email) {
    alert("❌ Username and email are required");
    return;
  }

  console.log('📊 Profile Data to Save:', profileData);

  try {
    const res = await fetch("http://127.0.0.1:8000/user/update-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "user-id": user.id
      },
      body: JSON.stringify({
        username: profileData.username,
        email: profileData.email,
        avatar: profileData.avatar,
        bio: profileData.bio,
        github_url: profileData.github_url,
        portfolio_url: profileData.portfolio_url,
        htb_profile: profileData.htb_profile,
        thm_profile: profileData.thm_profile,
        skills: JSON.stringify(profileData.skills),
        theme_color: profileData.theme_color,
        country: profileData.country,
        hacker_title: profileData.hacker_title,
        twitter_url: profileData.twitter_url,
        linkedin_url: profileData.linkedin_url
      })
    });


    if (res.ok) {
      // Update localStorage
      Object.assign(user, profileData);
      localStorage.setItem("user", JSON.stringify(user));

      // Apply theme color
      if (typeof applyThemeColor === 'function') {
        applyThemeColor(profileData.theme_color);
      }

      alert("✅ Profile updated successfully!");
      closeEditProfileModal();

      // Reload profile if on profile page
      if (typeof loadProfile === 'function') {
        loadProfile();
      }
    } else {
      const error = await res.json();
      alert("❌ " + (error.detail || "Failed to update profile"));
    }
  } catch (err) {
    console.error(err);
    alert("❌ Connection error");
  }
}

function openChangePasswordModal() {
  const modalHTML = `
    <div class="custom-modal-overlay" id="changePasswordModal">
      <div class="custom-modal-box">
        <div class="modal-header">
          <h3>Change Password</h3>
          <span class="close-modal" onclick="closeChangePasswordModal()">×</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Current Password</label>
            <div style="position: relative;">
              <input type="password" class="modal-input" id="current-password" placeholder="Enter current password" />
              <i class="fas fa-eye" id="toggle-current" onclick="togglePasswordVisibility('current-password', 'toggle-current')" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #888;"></i>
            </div>
          </div>
          <div class="form-group">
            <label>New Password</label>
            <div style="position: relative;">
              <input type="password" class="modal-input" id="new-password" placeholder="Enter new password" />
              <i class="fas fa-eye" id="toggle-new" onclick="togglePasswordVisibility('new-password', 'toggle-new')" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #888;"></i>
            </div>
          </div>
          <div class="form-group">
            <label>Confirm New Password</label>
            <div style="position: relative;">
              <input type="password" class="modal-input" id="confirm-password" placeholder="Re-enter new password" />
              <i class="fas fa-eye" id="toggle-confirm" onclick="togglePasswordVisibility('confirm-password', 'toggle-confirm')" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #888;"></i>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="closeChangePasswordModal()">Cancel</button>
          <button class="btn-save" onclick="savePasswordChanges()">Change Password</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  if (modal) modal.remove();
}

async function savePasswordChanges() {
  const user = JSON.parse(localStorage.getItem("user"));
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert("Please fill in all fields");
    return;
  }

  if (newPassword !== confirmPassword) {
    alert("❌ Passwords do not match");
    return;
  }

  if (newPassword.length < 6) {
    alert("❌ Password must be at least 6 characters");
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/user/change-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "user-id": user.id
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });

    if (res.ok) {
      alert("✅ Password changed!");
      closeChangePasswordModal();
    } else {
      const error = await res.json();
      alert("❌ " + (error.detail || "Failed to change password"));
    }
  } catch (err) {
    console.error(err);
    alert("❌ Connection error");
  }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
    icon.style.color = "#00ffbf";
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
    icon.style.color = "#888";
  }
}
