// ATS-Safe Elegant Template — High ATS parse rate, clean typography, zero emoji icons

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{
        fontSize: '10.5px',
        fontWeight: '700',
        letterSpacing: '1.8px',
        textTransform: 'uppercase',
        color: '#1e293b',
        borderBottom: '1px solid #cbd5e1',
        paddingBottom: '3px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
      }}>
        <span>{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function AtsElegantTemplate({ data, fontScale = 1 }) {
  const f = (n) => `${n * fontScale}px`
  const { personal, education, skills, projects, experience, certifications, achievements } = data
  const edu = education[0] || {}

  const contactList = [
    personal.phone,
    personal.email,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio,
  ].filter(Boolean)

  const hasSkills = Boolean(skills.languages || skills.frameworks || skills.tools || skills.soft)

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      fontSize: f(10),
      color: '#1e293b',
      lineHeight: '1.55',
      padding: '24mm 20mm',
      background: '#fff',
      minHeight: '297mm',
      width: '210mm',
      boxSizing: 'border-box',
    }}>
      {/* Refined ATS Header - Plain text, no emoji icons */}
      <div style={{ textAlign: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <div style={{
          fontSize: f(23),
          fontWeight: '800',
          color: '#0f172a',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          marginBottom: '5px',
        }}>
          {personal.name || 'YOUR NAME'}
        </div>

        {contactList.length > 0 && (
          <div style={{
            fontSize: '9px',
            color: '#475569',
            display: 'flex',
            justify: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            lineHeight: '1.4',
          }}>
            {contactList.map((item, idx) => (
              <span key={idx}>
                {item}
                {idx < contactList.length - 1 && <span style={{ marginLeft: '8px', color: '#94a3b8' }}>•</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Education Section */}
      {(edu.college || edu.degree) && (
        <Section title="Education">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '10.5px', color: '#0f172a' }}>{edu.college}</div>
              <div style={{ color: '#334155', fontSize: '9.5px' }}>
                {edu.degree}{edu.department ? ` — ${edu.department}` : ''}
              </div>
              {edu.intermediate && <div style={{ color: '#64748b', fontSize: '9px', marginTop: '1px' }}>Intermediate: {edu.intermediate}</div>}
              {edu.schooling && <div style={{ color: '#64748b', fontSize: '9px' }}>Schooling: {edu.schooling}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: '9px', color: '#475569' }}>
              {edu.year && <div>{edu.year}</div>}
              {edu.cgpa && <div style={{ fontWeight: '700', color: '#0f172a' }}>CGPA: {edu.cgpa}</div>}
            </div>
          </div>
        </Section>
      )}

      {/* Technical Skills Section */}
      {hasSkills && (
        <Section title="Technical Skills">
          <div style={{ fontSize: '9.5px', color: '#334155' }}>
            {skills.languages && (
              <div style={{ marginBottom: '3px' }}>
                <strong style={{ color: '#0f172a' }}>Languages: </strong>{skills.languages}
              </div>
            )}
            {skills.frameworks && (
              <div style={{ marginBottom: '3px' }}>
                <strong style={{ color: '#0f172a' }}>Frameworks & Libraries: </strong>{skills.frameworks}
              </div>
            )}
            {skills.tools && (
              <div style={{ marginBottom: '3px' }}>
                <strong style={{ color: '#0f172a' }}>Tools & Platforms: </strong>{skills.tools}
              </div>
            )}
            {skills.soft && (
              <div>
                <strong style={{ color: '#0f172a' }}>Soft Skills: </strong>{skills.soft}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Experience Section */}
      {experience.some(e => e.role || e.company) && (
        <Section title="Work Experience">
          {experience.filter(e => e.role || e.company).map(exp => (
            <div key={exp.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: '700', fontSize: '10.5px', color: '#0f172a' }}>
                  {exp.role}{exp.company ? ` | ${exp.company}` : ''}
                </span>
                <span style={{ fontSize: '9px', color: '#64748b' }}>{exp.duration}</span>
              </div>
              {exp.description && (
                <div style={{ color: '#334155', fontSize: '9.5px', marginTop: '2px', whiteSpace: 'pre-line' }}>
                  {exp.description}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Projects Section */}
      {projects.some(p => p.title) && (
        <Section title="Projects">
          {projects.filter(p => p.title).map(proj => (
            <div key={proj.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: '700', fontSize: '10.5px', color: '#0f172a' }}>{proj.title}</span>
                {proj.link && <span style={{ fontSize: '9px', color: '#475569' }}>{proj.link}</span>}
              </div>
              {proj.description && (
                <div style={{ color: '#334155', fontSize: '9.5px', marginTop: '2px' }}>
                  {proj.description}
                </div>
              )}
              {proj.tech && (
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                  <strong style={{ color: '#475569' }}>Technologies used:</strong> {proj.tech}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Certifications Section */}
      {certifications.some(c => c.course) && (
        <Section title="Certifications">
          {certifications.filter(c => c.course).map(cert => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '9.5px' }}>
              <span>
                <strong style={{ color: '#0f172a' }}>{cert.course}</strong>
                {cert.platform ? ` — ${cert.platform}` : ''}
              </span>
              {cert.year && <span style={{ fontSize: '9px', color: '#64748b' }}>{cert.year}</span>}
            </div>
          ))}
        </Section>
      )}

      {/* Achievements Section */}
      {achievements && (
        <Section title="Achievements & Honors">
          <div style={{ color: '#334155', fontSize: '9.5px', whiteSpace: 'pre-line' }}>
            {achievements}
          </div>
        </Section>
      )}
    </div>
  )
}
