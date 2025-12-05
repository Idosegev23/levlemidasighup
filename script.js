// Configuration
const WEBHOOK_URL = 'https://hook.eu2.make.com/h4n76ar8pjo8mu4cbtwywev50oic4q1c';
const SUPABASE_URL = 'https://kyhlbkgkqrraaugosvya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5aGxia2drcXJyYWF1Z29zdnlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MDQ5NjMsImV4cCI6MjA4MDQ4MDk2M30.Yz3k-m64C-Vlye01Qji69ELdYcWIcJilQ5VucGwZwIg';
const SITE_URL = 'https://levlemidasighup.vercel.app';

// Initialize Signature Pad
let signaturePad;
const canvas = document.getElementById('signatureCanvas');

function initSignaturePad() {
    resizeCanvas();
    
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(45, 55, 72)',
        minWidth: 1,
        maxWidth: 3,
        velocityFilterWeight: 0.7
    });
    
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
    
    if (signaturePad) {
        signaturePad.clear();
    }
}

// Clear Signature Button
document.getElementById('clearSignature').addEventListener('click', () => {
    signaturePad.clear();
});

// Form Validation
function validateForm() {
    const studentName = document.getElementById('studentName').value.trim();
    const birthDate = document.getElementById('birthDate').value;
    const parentName = document.getElementById('parentName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const policyAgreement = document.getElementById('policyAgreement').checked;
    
    let isValid = true;
    let errorMessage = '';
    
    if (!studentName) {
        errorMessage = 'נא להזין את שם התלמיד/ה';
        isValid = false;
    } else if (!birthDate) {
        errorMessage = 'נא להזין תאריך לידה';
        isValid = false;
    } else if (!parentName) {
        errorMessage = 'נא להזין את שם ההורה';
        isValid = false;
    } else if (!phone || phone.length < 9) {
        errorMessage = 'נא להזין מספר טלפון תקין';
        isValid = false;
    } else if (!email || !email.includes('@')) {
        errorMessage = 'נא להזין כתובת אימייל תקינה';
        isValid = false;
    } else if (!policyAgreement) {
        errorMessage = 'נא לאשר את מדיניות ההרשמה';
        isValid = false;
    } else if (signaturePad.isEmpty()) {
        errorMessage = 'נא לחתום על הטופס';
        isValid = false;
    }
    
    if (!isValid) {
        alert(errorMessage);
    }
    
    return isValid;
}

// Generate URL-friendly slug from Hebrew name
function generateSlug(name) {
    // Create a URL-safe slug from Hebrew name
    const slug = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\u0590-\u05FFa-z0-9\-]/g, '') // Keep Hebrew, English, numbers, and hyphens
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    return `${slug}-${timestamp}`;
}

// Format Date
function formatDateShort(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateHebrew(dateString) {
    const date = new Date(dateString);
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    return `${date.getDate()} ב${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Save to Supabase
async function saveToSupabase(formData, slug) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            student_name: formData.studentName,
            student_slug: slug,
            birth_date: formData.birthDate,
            parent_name: formData.parentName,
            phone: formData.phone,
            email: formData.email,
            signature: formData.signature,
            policy_agreement: formData.policyAgreement
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בשמירת הנתונים');
    }
    
    return await response.json();
}

// Generate Email HTML for Parent
function generateEmailHTML(formData, certificateUrl) {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>אישור הרשמה - לב ללמידה</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; background-color: #f5f5f5; direction: rtl;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7CB583 0%, #FFC084 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">לב ללמידה</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">מרחב רגוע, מותאם ואישי לכל ילד</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 22px;">שלום ${formData.parentName},</h2>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">
                                תודה על הרשמתכם לקבוצות הלמידה של לב ללמידה!<br>
                                אנחנו שמחים לקבל את ${formData.studentName} למשפחה שלנו.
                            </p>
                            
                            <!-- Registration Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F1C1; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h3 style="color: #2D3748; margin: 0 0 15px 0; font-size: 18px;">פרטי ההרשמה</h3>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 8px 0; color: #4A5568; font-size: 15px;">
                                                    <strong>שם התלמיד/ה:</strong> ${formData.studentName}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #4A5568; font-size: 15px;">
                                                    <strong>תאריך לידה:</strong> ${formatDateShort(formData.birthDate)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #4A5568; font-size: 15px;">
                                                    <strong>שם ההורה:</strong> ${formData.parentName}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #4A5568; font-size: 15px;">
                                                    <strong>טלפון:</strong> ${formData.phone}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #4A5568; font-size: 15px;">
                                                    <strong>תאריך הרשמה:</strong> ${formatDateShort(formData.registrationDate)}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Certificate Link -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                                <tr>
                                    <td align="center">
                                        <a href="${certificateUrl}" style="display: inline-block; background: linear-gradient(135deg, #7CB583, #FFC084); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 10px; font-size: 16px; font-weight: bold;">
                                            צפייה באישור ההרשמה
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Confirmation Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #E8F5E9; border-radius: 12px; border-right: 4px solid #7CB583; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="color: #2D3748; font-size: 15px; line-height: 1.6; margin: 0;">
                                            מדיניות ההרשמה, התשלום וההתנהלות אושרה ונחתמה בתאריך ${formatDateShort(formData.registrationDate)}.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.7; margin: 0 0 15px 0;">
                                ניצור איתכם קשר בהקדם עם פרטים נוספים על מועדי השיעורים והכנות לתחילת הלימודים.
                            </p>
                            
                            <p style="color: #4A5568; font-size: 16px; line-height: 1.7; margin: 0;">
                                לכל שאלה, אנחנו כאן בשבילכם.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #7CB583; padding: 25px 30px; text-align: center;">
                            <p style="color: #ffffff; margin: 0; font-size: 14px;">
                                בברכה חמה,<br>
                                <strong>צוות לב ללמידה</strong>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Show Loading
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">שולח את הטופס...</div>
    `;
    document.body.appendChild(overlay);
}

// Hide Loading
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Show Success with certificate link
function showSuccess(certificateUrl) {
    document.getElementById('registrationForm').style.display = 'none';
    const successDiv = document.getElementById('successMessage');
    successDiv.innerHTML = `
        <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        </div>
        <h2>ההרשמה התקבלה בהצלחה!</h2>
        <p>קובץ אישור ההרשמה נשלח לכתובת המייל שציינת.</p>
        <p>נשמח לראותכם בשיעורים!</p>
        <a href="${certificateUrl}" class="certificate-link" target="_blank">צפייה באישור ההרשמה</a>
    `;
    successDiv.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Form Submit Handler
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    
    showLoading();
    
    try {
        // Collect form data
        const formData = {
            studentName: document.getElementById('studentName').value.trim(),
            birthDate: document.getElementById('birthDate').value,
            parentName: document.getElementById('parentName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            policyAgreement: document.getElementById('policyAgreement').checked,
            signature: signaturePad.toDataURL('image/png'),
            registrationDate: new Date().toISOString()
        };
        
        // Generate unique slug
        const slug = generateSlug(formData.studentName);
        const certificateUrl = `${SITE_URL}/certificate/${slug}`;
        
        // Save to Supabase
        await saveToSupabase(formData, slug);
        
        // Generate email HTML
        const emailHTML = generateEmailHTML(formData, certificateUrl);
        
        // Send to webhook for Make automation
        const payload = {
            studentName: formData.studentName,
            studentSlug: slug,
            birthDate: formData.birthDate,
            birthDateFormatted: formatDateShort(formData.birthDate),
            parentName: formData.parentName,
            phone: formData.phone,
            email: formData.email,
            policyAgreement: formData.policyAgreement,
            signature: formData.signature,
            registrationDate: formData.registrationDate,
            registrationDateFormatted: formatDateShort(formData.registrationDate),
            certificateUrl: certificateUrl,
            emailHTML: emailHTML,
            emailSubject: `אישור הרשמה - ${formData.studentName} - לב ללמידה`
        };
        
        // Send to webhook (for email and any other automation)
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        hideLoading();
        showSuccess(certificateUrl);
        
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        alert('אירעה שגיאה בשליחת הטופס. אנא נסו שוב.');
        submitBtn.disabled = false;
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initSignaturePad();
    
    // Set max date for birth date (today)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('birthDate').setAttribute('max', today);
    
    // Set min date (100 years ago)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 100);
    document.getElementById('birthDate').setAttribute('min', minDate.toISOString().split('T')[0]);
});

// Prevent form submission on Enter key in inputs
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const inputs = Array.from(document.querySelectorAll('input:not([type="checkbox"])'));
            const currentIndex = inputs.indexOf(e.target);
            if (currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
        }
    });
});
