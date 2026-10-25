import sqlite3
import os

DB_PATH = "backend/app.db"

# Original Educational Content for Ethical Hacking Portal
MODULES_DATA = [
    {
        "title": "Introduction to Web Security",
        "description": "Master the fundamentals of web application security, from HTTP basics to common vulnerabilities.",
        "difficulty": "Beginner",
        "category": "Web Security",
        "rooms": [
            {
                "title": "HTTP Protocol Basics",
                "description": "Understanding how the web works",
                "content": """In this task, you'll learn the fundamentals of HTTP (Hypertext Transfer Protocol).

**What is HTTP?**
HTTP is the foundation of data communication on the web. It's a request-response protocol between clients and servers.

**Key Concepts:**
- Request Methods: `GET`, `POST`, `PUT`, `DELETE`
- Status Codes: `200 OK`, `404 Not Found`, `500 Internal Server Error`
- Headers: Information about the request/response
- Body: The actual data being transmitted

**Task:**
Use browser DevTools (F12) to inspect HTTP requests on any website and identify:
1. The request method used
2. Response status code
3. At least 3 headers""",
                "order_index": 0,
                "points": 10
            },
            {
                "title": "Understanding Cookies and Sessions",
                "description": "Learn how web applications maintain state",
                "content": """Cookies and sessions are crucial for maintaining user state in web applications.

**Cookies:**
Small pieces of data stored in the browser. Format: `name=value`

**Sessions:**
Server-side storage mechanism to track user activity across requests.

**Security Implications:**
- Session hijacking
- Cookie theft via XSS
- Importance of `HttpOnly` and `Secure` flags

**Task:**
Examine cookies in your browser's DevTools and identify which cookies have security flags enabled.""",
                "order_index": 1,
                "points": 15
            },
            {
                "title": "Introduction to SQL Injection",
                "description": "Understanding database injection vulnerabilities",
                "content": """SQL Injection is one of the most critical web vulnerabilities.

**What is SQL Injection?**
It occurs when user input is directly inserted into SQL queries without proper sanitization.

**Example Vulnerable Code:**
```
query = "SELECT * FROM users WHERE username='" + input + "'"
```

**Attack Example:**
Input: `admin' OR '1'='1`
Results in: `SELECT * FROM users WHERE username='admin' OR '1'='1'`

**Prevention:**
- Use parameterized queries
- Input validation
- Least privilege database accounts

**Task:**
Research prepared statements in your preferred programming language.""",
                "order_index": 2,
                "points": 20
            }
        ]
    },
    {
        "title": "Linux Fundamentals",
        "description": "Essential Linux commands and concepts for security professionals.",
        "difficulty": "Beginner",
        "category": "System Security",
        "rooms": [
            {
                "title": "Linux File System Navigation",
                "description": "Master basic Linux directory structure",
                "content": """Understanding the Linux file system is crucial for any security professional.

**Key Directories:**
- `/` - Root directory
- `/home` - User home directories
- `/etc` - Configuration files
- `/var` - Variable data (logs, databases)
- `/tmp` - Temporary files

**Essential Commands:**
- `pwd` - Print working directory
- `ls` - List directory contents
- `cd` - Change directory
- `cat` - Display file contents
- `less` - View file with pagination

**Task:**
Practice navigating the file system and locating configuration files.""",
                "order_index": 0,
                "points": 10
            },
            {
                "title": "File Permissions and Ownership",
                "description": "Understanding Linux permission model",
                "content": """Linux uses a robust permission system to control file access.

**Permission Types:**
- Read (r) - View file contents
- Write (w) - Modify file
- Execute (x) - Run file as program

**Permission Groups:**
- Owner - File creator
- Group - Users in the file's group
- Others - Everyone else

**Commands:**
- `chmod` - Change permissions
- `chown` - Change ownership
- `ls -l` - View detailed file information

**Example:**
`-rw-r--r--` means:
- Owner: read, write
- Group: read
- Others: read

**Task:**
Create a file and practice modifying its permissions using `chmod`.""",
                "order_index": 1,
                "points": 15
            }
        ]
    },
    {
        "title": "Network Security Essentials",
        "description": "Learn network protocols, scanning, and security fundamentals.",
        "difficulty": "Intermediate",
        "category": "Network Security",
        "rooms": [
            {
                "title": "TCP/IP Model Overview",
                "description": "Understanding network communication layers",
                "content": """The TCP/IP model is the foundation of internet communication.

**Four Layers:**
1. **Application Layer** - HTTP, FTP, SSH, DNS
2. **Transport Layer** - TCP, UDP
3. **Internet Layer** - IP, ICMP
4. **Network Access Layer** - Ethernet, Wi-Fi

**TCP vs UDP:**
- TCP: Reliable, connection-oriented
- UDP: Fast, connectionless

**Common Ports:**
- 80: HTTP
- 443: HTTPS
- 22: SSH
- 21: FTP

**Task:**
Use `netstat` or `ss` to view active network connections on your system.""",
                "order_index": 0,
                "points": 15
            },
            {
                "title": "Network Scanning with Nmap",
                "description": "Introduction to network reconnaissance",
                "content": """Nmap is a powerful network scanning tool used for security auditing.

**Basic Scan Types:**
- `nmap <target>` - Basic scan
- `nmap -sS <target>` - SYN scan (stealth)
- `nmap -sV <target>` - Service version detection
- `nmap -O <target>` - OS detection
- `nmap -p- <target>` - Scan all ports

**Important Flags:**
- `-p` - Specify ports
- `-A` - Aggressive scan (OS, version, scripts)
- `-T4` - Faster timing
- `-Pn` - Skip host discovery

**Ethical Considerations:**
Only scan networks you have permission to test!

**Task:**
Install Nmap and scan localhost (127.0.0.1) to identify open ports.""",
                "order_index": 1,
                "points": 20
            }
        ]
    },
    {
        "title": "Cross-Site Scripting (XSS) Deep Dive",
        "description": "Understanding and exploiting XSS vulnerabilities in web applications.",
        "difficulty": "Intermediate",
        "category": "Web Security",
        "rooms": [
            {
                "title": "What is XSS?",
                "description": "Understanding Cross-Site Scripting fundamentals",
                "content": """Cross-Site Scripting allows attackers to inject malicious scripts into web pages.

**Types of XSS:**
1. **Reflected XSS** - Payload in URL, reflected in response
2. **Stored XSS** - Payload stored in database
3. **DOM-based XSS** - Vulnerability in client-side code

**Example Vulnerable Code:**
```html
<div>Welcome, {{username}}</div>
```

**Attack Payload:**
```
<script>alert(document.cookie)</script>
```

**Impact:**
- Session hijacking
- Credential theft
- Defacement
- Malware distribution

**Prevention:**
- Input sanitization
- Output encoding
- Content Security Policy (CSP)
- HttpOnly cookies

**Task:**
Research HTML entity encoding and how it prevents XSS.""",
                "order_index": 0,
                "points": 20
            }
        ]
    },
    {
        "title": "Cryptography Basics",
        "description": "Introduction to encryption, hashing, and cryptographic concepts.",
        "difficulty": "Intermediate",
        "category": "Cryptography",
        "rooms": [
            {
                "title": "Hashing vs Encryption",
                "description": "Understanding the difference",
                "content": """Hashing and encryption are often confused but serve different purposes.

**Hashing:**
- One-way function
- Same input always produces same output
- Cannot be reversed
- Use cases: Password storage, integrity verification

**Common Hash Algorithms:**
- MD5 (broken, don't use for security)
- SHA-1 (deprecated)
- SHA-256 (current standard)
- bcrypt (for passwords)

**Encryption:**
- Two-way function
- Can be decrypted with correct key
- Use cases: Secure communication, data protection

**Types:**
- Symmetric: Same key for encryption/decryption (AES)
- Asymmetric: Key pair - public/private (RSA)

**Task:**
Hash a string using SHA-256 online tool and verify it produces consistent output.""",
                "order_index": 0,
                "points": 15
            },
            {
                "title": "Password Security Best Practices",
                "description": "Secure password storage and authentication",
                "content": """Proper password handling is crucial for application security.

**Never Do:**
- Store passwords in plain text
- Use weak hashing (MD5, SHA-1)
- Use encryption for passwords

**Best Practices:**
1. Use bcrypt, scrypt, or Argon2
2. Add salt (random data) to each password
3. Implement rate limiting
4. Use multi-factor authentication

**Password Hashing Process:**
```
salt = generate_random_salt()
hash = bcrypt(password + salt)
store(username, hash, salt)
```

**Why Salt?**
Prevents rainbow table attacks by ensuring identical passwords have different hashes.

**Task:**
Research what a rainbow table is and why salting defeats it.""",
                "order_index": 1,
                "points": 20
            }
        ]
    },
    {
        "title": "OWASP Top 10 Overview",
        "description": "Understanding the most critical web application security risks.",
        "difficulty": "Advanced",
        "category": "Web Security",
        "rooms": [
            {
                "title": "OWASP Top 10 - 2021",
                "description": "Overview of critical web vulnerabilities",
                "content": """The OWASP Top 10 is a standard awareness document for web security.

**Top 10 Risks:**
1. **Broken Access Control** - Users can access unauthorized resources
2. **Cryptographic Failures** - Weak encryption or exposed sensitive data
3. **Injection** - SQL, NoSQL, OS command injection
4. **Insecure Design** - Architectural flaws
5. **Security Misconfiguration** - Default configs, unnecessary features
6. **Vulnerable Components** - Outdated libraries
7. **Authentication Failures** - Weak credential management
8. **Software and Data Integrity** - Unverified updates
9. **Security Logging Failures** - Inadequate monitoring
10. **Server-Side Request Forgery (SSRF)** - Server makes malicious requests

**Task:**
Research each vulnerability and identify real-world examples.""",
                "order_index": 0,
                "points": 25
            }
        ]
    }
]

def seed_database():
    """Populate database with educational modules and rooms"""
    
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        print("Please run init_modules_db.py first!")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    print("🌱 Seeding database with educational content...")
    
    # Clear existing modules and rooms
    print("Clearing existing modules...")
    cur.execute("DELETE FROM user_room_progress")
    cur.execute("DELETE FROM user_module_progress")
    cur.execute("DELETE FROM rooms")
    cur.execute("DELETE FROM modules")
    conn.commit()
    
    modules_created = 0
    rooms_created = 0
    
    for module_data in MODULES_DATA:
        # Insert module
        cur.execute("""
            INSERT INTO modules (title, description, difficulty, category, is_published)
            VALUES (?, ?, ?, ?, 1)
        """, (
            module_data["title"],
            module_data["description"],
            module_data["difficulty"],
            module_data["category"]
        ))
        
        module_id = cur.lastrowid
        modules_created += 1
        print(f"✅ Created module: {module_data['title']}")
        
        # Insert rooms for this module
        for room in module_data["rooms"]:
            cur.execute("""
                INSERT INTO rooms (module_id, title, description, content, order_index, points)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                module_id,
                room["title"],
                room["description"],
                room["content"],
                room["order_index"],
                room["points"]
            ))
            rooms_created += 1
            print(f"  ├─ Created room: {room['title']}")
    
    conn.commit()
    conn.close()
    
    print(f"\n🎉 Seeding complete!")
    print(f"📦 Created {modules_created} modules")
    print(f"📝 Created {rooms_created} rooms/tasks")
    print(f"\n💡 Refresh your browser to see the new content!")

if __name__ == "__main__":
    seed_database()
