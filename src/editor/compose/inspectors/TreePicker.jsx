import { Dropdown, LabeledControl, SettingsRow } from '@kolkrabbi/kol-component'
import { useControlSize, RAIL_LABEL_W } from '../../params/controlSize'

/* PickerDropdown — the picker stack's dropdown styling (subtle / sm /
 * full-width), shared so every level of every picker renders identically. */
export function PickerDropdown(props) {
  const cs = useControlSize()
  return <Dropdown variant="subtle" size={cs} className="w-full" {...props} />
}

/* PickerRow — one labeled level of a picker stack. `children` replaces the
 * default dropdown for rows with custom content (LoopPicker's grouped Type
 * row, read-only legacy labels).
 *
 * `inline` (the labs skin) is the DS SettingsRow — uppercase helper label in
 * the rail's column, the dropdown across the rest — the same row every schema
 * param renders as (AutoControls). Until 2026-09-01 the picker stack was the
 * label-above LabeledControl in both skins, so TYPE · CATEGORY · PRESET sat
 * sentence-case over a rail of uppercase rows (user: "why are so many section
 * eyebrows lowercase?"). The editor keeps label-above. */
export function PickerRow({ label, options, value, onChange, children, inline = false }) {
  const control = children ?? <PickerDropdown options={options} value={value} onChange={onChange} />
  return inline
    ? <SettingsRow label={label} align="fill" labelWidth={RAIL_LABEL_W}>{control}</SettingsRow>
    : <LabeledControl label={label}>{control}</LabeledControl>
}

/**
 * TreePicker — the generic TYPE > CATEGORY > PRESET dropdown stack
 * (docs/documentation/01-hierarchy.md) over a flat preset catalog:
 *
 *   tree    — [{ label, subs }] types; the Type dropdown uses the label as
 *             its value (the taxonomies carry no separate type ids)
 *   presets — flat [{ id, label, sub }] catalog
 *   current — the active preset object
 *   onPick  — (preset) => void; type/category hops land on the target's
 *             first preset (preset semantics: a curated starting point,
 *             not a patch)
 *
 * LoopPicker's registry-backed picker shares PickerRow / PickerDropdown but
 * keeps its own logic — its hierarchy has an extra registry-group level plus
 * a read-only legacy fallback that don't fit this flat shape.
 */
export function TreePicker({ tree, presets, current, onPick, inline = false }) {
  const type = tree.find((t) => t.subs.includes(current.sub)) ?? tree[0]
  const subPresets = presets.filter((p) => p.sub === current.sub)
  const firstOf = (sub) => presets.find((p) => p.sub === sub)

  return (
    <>
      <PickerRow
        inline={inline}
        label="Type"
        options={tree.map((t) => ({ value: t.label, label: t.label }))}
        value={type.label}
        onChange={(label) => {
          const t = tree.find((x) => x.label === label)
          if (t) onPick(firstOf(t.subs[0]))
        }}
      />
      <PickerRow
        inline={inline}
        label="Category"
        options={type.subs.map((s) => ({ value: s, label: s }))}
        value={current.sub}
        onChange={(s) => onPick(firstOf(s))}
      />
      <PickerRow
        inline={inline}
        label="Preset"
        options={subPresets.map((p) => ({ value: p.id, label: p.label }))}
        value={current.id}
        onChange={(id) => onPick(presets.find((p) => p.id === id))}
      />
    </>
  )
}
