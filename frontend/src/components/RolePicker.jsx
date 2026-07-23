export default function RolePicker({ value, onChange, name = 'role' }) {
  return (
    <fieldset className="field-group">
      <legend>I am a…</legend>
      <div className="role-choice">
        <label className={`role-option ${value === 'elder' ? 'role-option--active' : ''}`}>
          <input type="radio" name={name} value="elder" checked={value === 'elder'} onChange={() => onChange('elder')} />
          <span className="role-option-title">Older Adult</span>
          <span className="role-option-desc">I want my family to help me keep track of things</span>
        </label>
        <label className={`role-option ${value === 'caregiver' ? 'role-option--active' : ''}`}>
          <input type="radio" name={name} value="caregiver" checked={value === 'caregiver'} onChange={() => onChange('caregiver')} />
          <span className="role-option-title">Family Member / Caregiver</span>
          <span className="role-option-desc">I want to help a loved one stay on top of things</span>
        </label>
      </div>
    </fieldset>
  )
}
