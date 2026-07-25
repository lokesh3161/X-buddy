// Two-Column Technical Template — Sidebar for skills/edu/certs, main column for experience/projects

function SideSection({ title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        color: '#0f766e', // Deep Teal Accent
        borderBottom: '1.5px solid #0f766e',
        paddingBottom: '3px',
        marginBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function MainSection({ title, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '1.4px',
        textTransform: 'uppercase',
        color: '#0f766e',
        borderBottom: '1.5px solid #e2e8f0',
        paddingBottom: '3px',
        marginBottom: '9px',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function TechTag({ children }) {
  return (
    <span style={{
      display: 'inline-block',
      background: '#ccfbf1',
      color: '#0f766e',
      borderRadius: '4px',
      padding: '1px 6px',
      fontSize: '8.5px',
      fontWeight: '600',
      marginRight: '4px',
      marginBottom: '3px',
    }}>
      {children}
    </span>
  )
}

export default function TwoColumnTechTemplate({ data, fontScale = 1 }) {
  const f = (n) => `${n * fontScale}px`
  const { personal, education, skills, projects, experience, certifications, achievements } = data
  const edu = education[0] || {}

  const hasSidebarSkills = Boolean(skills.languages || skills.frameworks || skills.tools || skills.soft)
  const hasSidebarEdu = Boolean(edu.college || edu.degree)
  const hasSidebarCerts = certifications.some(c => c.course)
  const hasSidebarContent = hasSidebarSkills || hasSidebarEdu || hasSidebarCerts

  const hasMainExp = experience.some(e => e.role || e.company)
  const hasMainProjects = projects.some(p => p.title)
  const hasMainAchievements = Boolean(achievements)

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, sans-serif",
      fontSize: f(10),
      color: '#1e293b',
      lineHeight: '1.55',
      padding: '22mm 18mm',
      background: '#fff',
      minHeight: '297mm',
      width: '210mm',
      boxSizing: 'border-box',
    }}>
      {/* Top Header */}
      <div style={{ marginBottom: '18px', borderBottom: '2.5px solid #0f766e', paddingBottom: '12px' }}>
        <div style={{ fontSize: f(24), fontWeight: '800', color: '#0f766e', letterSpacing: '-0.3px' }}>
          {personal.name || 'YOUR NAME'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px', fontSize: '9px', color: '#475569' }}>
          {personal.phone && <span>📞 {personal.phone}</span>}
          {personal.email && <span>✉ {personal.email}</span>}
          {personal.location && <span>📍 {personal.location}</span>}
          {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
          {personal.github && <span>⌥ {personal.github}</span>}
          {personal.portfolio && <span>🌐 {personal.portfolio}</span>}
        </div>
      </div>

      {/* Two-Column Body — Handles empty sections gracefully */}
      <div style={{ display: 'flex', gap: '22px' }}>
        {/* Left Sidebar (~32% width) — renders only if sidebar content exists */}
        {hasSidebarContent && (
          <div style={{ width: '32%', flexShrink: 0, borderRight: '1px solid #f1f5f9', paddingRight: '14px' }}>
            {/* Skills */}
            {hasSidebarSkills && (
              <SideSection title="Technical Skills">
                {skills.languages && (
                  <div style={{ marginBottom: '7px' }}>
                    <div style={{ fontWeight: '700', fontSize: '9px', color: '#334155', marginBottom: '2px' }}>Languages</div>
                    <div style={{ color: '#475569', fontSize: '8.5px', lineHeight: '1.4' }}>{skills.languages}</div>
                  </div>
                )}
                {skills.frameworks && (
                  <div style={{ marginBottom: '7px' }}>
                    <div style={{ fontWeight: '700', fontSize: '9px', color: '#334155', marginBottom: '2px' }}>Frameworks</div>
                    <div style={{ color: '#475569', fontSize: '8.5px', lineHeight: '1.4' }}>{skills.frameworks}</div>
                  </div>
                )}
                {skills.tools && (
                  <div style={{ marginBottom: '7px' }}>
                    <div style={{ fontWeight: '700', fontSize: '9px', color: '#334155', marginBottom: '2px' }}>Tools & DevOp</div>
                    <div style={{ color: '#475569', fontSize: '8.5px', lineHeight: '1.4' }}>{skills.tools}</div>
                  </div>
                )}
                {skills.soft && (
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '9px', color: '#334155', marginBottom: '2px' }}>Soft Skills</div>
                    <div style={{ color: '#475569', fontSize: '8.5px', lineHeight: '1.4' }}>{skills.soft}</div>
                  </div>
                )}
              </SideSection>
            )}

            {/* Education in Sidebar */}
            {hasSidebarEdu && (
              <SideSection title="Education">
                <div style={{ fontWeight: '700', fontSize: '9.5px', color: '#0f172a' }}>{edu.college}</div>
                <div style={{ color: '#0f766e', fontSize: '9px', fontWeight: '600' }}>
                  {edu.degree}{edu.department ? ` (${edu.department})` : ''}
                </div>
                {edu.year && <div style={{ color: '#64748b', fontSize: '8.5px', marginTop: '2px' }}>{edu.year}</div>}
                {edu.cgpa && <div style={{ color: '#0f766e', fontSize: '8.5px', fontWeight: '700' }}>CGPA: {edu.cgpa}</div>}
                {edu.intermediate && <div style={{ color: '#64748b', fontSize: '8.5px', marginTop: '3px' }}>Inter: {edu.intermediate}</div>}
                {edu.schooling && <div style={{ color: '#64748b', fontSize: '8.5px' }}>School: {edu.schooling}</div>}
              </SideSection>
            )}

            {/* Certifications in Sidebar */}
            {hasSidebarCerts && (
              <SideSection title="Certifications">
                {certifications.filter(c => c.course).map(cert => (
                  <div key={cert.id} style={{ marginBottom: '6px' }}>
                    <div style={{ fontWeight: '600', fontSize: '9px', color: '#0f172a' }}>{cert.course}</div>
                    {cert.platform && <div style={{ color: '#64748b', fontSize: '8.5px' }}>{cert.platform}</div>}
                    {cert.year && <div style={{ color: '#94a3b8', fontSize: '8px' }}>{cert.year}</div>}
                  </div>
                ))}
              </SideSection>
            )}
          </div>
        )}

        {/* Right Main Column — takes full width if sidebar is empty, otherwise flex: 1 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Work Experience */}
          {hasMainExp && (
            <MainSection title="Work Experience">
              {experience.filter(e => e.role || e.company).map(exp => (
                <div key={exp.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: '700', fontSize: '10.5px', color: '#0f172a' }}>{exp.role}</span>
                    <span style={{ fontSize: '8.5px', color: '#64748b' }}>{exp.duration}</span>
                  </div>
                  <div style={{ color: '#0f766e', fontSize: '9.5px', fontWeight: '600' }}>{exp.company}</div>
                  {exp.description && (
                    <div style={{ color: '#334155', fontSize: '9px', marginTop: '2px', lineHeight: '1.45', whiteSpace: 'pre-line' }}>
                      {exp.description}
                    </div>
                  )}
                </div>
              ))}
            </MainSection>
          )}

          {/* Key Technical Projects */}
          {hasMainProjects && (
            <MainSection title="Technical Projects">
              {projects.filter(p => p.title).map(proj => (
                <div key={proj.id} style={{ marginBottom: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: '700', fontSize: '10.5px', color: '#0f172a' }}>{proj.title}</span>
                    {proj.link && <span style={{ fontSize: '8.5px', color: '#0f766e' }}>{proj.link}</span>}
                  </div>
                  {proj.description && (
                    <div style={{ color: '#334155', fontSize: '9px', marginTop: '2px', lineHeight: '1.45' }}>
                      {proj.description}
                    </div>
                  )}
                  {proj.tech && (
                    <div style={{ marginTop: '4px' }}>
                      {proj.tech.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                        <TechTag key={i}>{t}</TechTag>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </MainSection>
          )}

          {/* Achievements */}
          {hasMainAchievements && (
            <MainSection title="Key Achievements">
              <div style={{ color: '#334155', fontSize: '9px', whiteSpace: 'pre-line', lineHeight: '1.45' }}>
                {achievements}
              </div>
            </MainSection>
          )}
        </div>
      </div>
    </div>
  )
}
