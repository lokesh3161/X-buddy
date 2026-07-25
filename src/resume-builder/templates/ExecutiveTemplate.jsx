// Executive / Corporate Template — Traditional single-column, serif typography, navy accents

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        color: '#1e3a8a', // Navy accent
        borderBottom: '1.5px solid #1e3a8a',
        paddingBottom: '3px',
        marginBottom: '9px',
        fontFamily: "'Georgia', 'Garamond', serif",
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function ExecutiveTemplate({ data, fontScale = 1 }) {
  const f = (n) => `${n * fontScale}px`
  const { personal, education, skills, projects, experience, certifications, achievements } = data
  const edu = education[0] || {}

  const contactItems = [
    personal.phone,
    personal.email,
    personal.location,
    personal.linkedin,
    personal.portfolio,
    personal.github,
  ].filter(Boolean)

  const hasSkills = Boolean(skills.languages || skills.frameworks || skills.tools || skills.soft)

  return (
    <div style={{
      fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif",
      fontSize: f(10.5),
      color: '#1e293b',
      lineHeight: '1.6',
      padding: '24mm 20mm',
      background: '#fff',
      minHeight: '297mm',
      width: '210mm',
      boxSizing: 'border-box',
    }}>
      {/* Conservative Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #1e3a8a', paddingBottom: '14px' }}>
        <div style={{
          fontSize: f(24),
          fontWeight: '700',
          color: '#1e3a8a',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          {personal.name || 'YOUR NAME'}
        </div>

        {contactItems.length > 0 && (
          <div style={{
            fontSize: '9.5px',
            color: '#475569',
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            display: 'flex',
            justify: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            {contactItems.map((item, idx) => (
              <span key={idx}>
                {item}
                {idx < contactItems.length - 1 && <span style={{ marginLeft: '12px', color: '#cbd5e1' }}>|</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Education */}
      {(edu.college || edu.degree) && (
        <Section title="Education">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a' }}>{edu.college}</div>
              <div style={{ color: '#334155', fontSize: '10px', fontStyle: 'italic' }}>
                {edu.degree}{edu.department ? ` in ${edu.department}` : ''}
              </div>
              {edu.intermediate && <div style={{ color: '#64748b', fontSize: '9.5px', marginTop: '2px' }}>Intermediate: {edu.intermediate}</div>}
              {edu.schooling && <div style={{ color: '#64748b', fontSize: '9.5px' }}>Schooling: {edu.schooling}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: '9.5px', color: '#475569', fontFamily: "'Arial', sans-serif" }}>
              {edu.year && <div>{edu.year}</div>}
              {edu.cgpa && <div style={{ fontWeight: '700', color: '#1e3a8a' }}>CGPA / Score: {edu.cgpa}</div>}
            </div>
          </div>
        </Section>
      )}

      {/* Professional Experience */}
      {experience.some(e => e.role || e.company) && (
        <Section title="Professional Experience">
          {experience.filter(e => e.role || e.company).map(exp => (
            <div key={exp.id} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a' }}>{exp.role}</span>
                <span style={{ fontSize: '9.5px', color: '#64748b', fontFamily: "'Arial', sans-serif" }}>{exp.duration}</span>
              </div>
              <div style={{ color: '#1e3a8a', fontSize: '10px', fontWeight: '600', fontStyle: 'italic', marginBottom: '3px' }}>
                {exp.company}
              </div>
              {exp.description && (
                <div style={{ color: '#334155', fontSize: '9.5px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {exp.description}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Key Projects */}
      {projects.some(p => p.title) && (
        <Section title="Key Projects & Initiatives">
          {projects.filter(p => p.title).map(proj => (
            <div key={proj.id} style={{ marginBottom: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: '700', fontSize: '11px', color: '#0f172a' }}>{proj.title}</span>
                {proj.link && <span style={{ fontSize: '9px', color: '#1e3a8a', fontFamily: "'Arial', sans-serif" }}>{proj.link}</span>}
              </div>
              {proj.description && (
                <div style={{ color: '#334155', fontSize: '9.5px', marginTop: '2px', lineHeight: '1.5' }}>
                  {proj.description}
                </div>
              )}
              {proj.tech && (
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2.5px', fontStyle: 'italic' }}>
                  Technologies / Focus: {proj.tech}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Skills & Competencies */}
      {hasSkills && (
        <Section title="Technical & Functional Competencies">
          <div style={{ fontSize: '9.5px', color: '#334155', lineHeight: '1.6' }}>
            {skills.languages && (
              <div style={{ marginBottom: '3px' }}>
                <strong style={{ color: '#0f172a' }}>Core Languages:</strong> {skills.languages}
              </div>
            )}
            {skills.frameworks && (
              <div style={{ marginBottom: '3px' }}>
                <strong style={{ color: '#0f172a' }}>Frameworks & Libraries:</strong> {skills.frameworks}
              </div>
            )}
            {skills.tools && (
              <div style={{ marginBottom: '3px' }}>
                <strong style={{ color: '#0f172a' }}>Tools & Platforms:</strong> {skills.tools}
              </div>
            )}
            {skills.soft && (
              <div>
                <strong style={{ color: '#0f172a' }}>Management & Leadership:</strong> {skills.soft}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Certifications */}
      {certifications.some(c => c.course) && (
        <Section title="Certifications & Training">
          {certifications.filter(c => c.course).map(cert => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '9.5px' }}>
              <div>
                <strong style={{ color: '#0f172a' }}>{cert.course}</strong>
                {cert.platform && <span style={{ color: '#475569' }}> — {cert.platform}</span>}
              </div>
              {cert.year && <span style={{ color: '#64748b', fontFamily: "'Arial', sans-serif" }}>{cert.year}</span>}
            </div>
          ))}
        </Section>
      )}

      {/* Achievements */}
      {achievements && (
        <Section title="Honors & Achievements">
          <div style={{ color: '#334155', fontSize: '9.5px', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
            {achievements}
          </div>
        </Section>
      )}
    </div>
  )
}
