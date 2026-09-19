param([string]$Task="")
if ($Task) {
  codex exec -m gpt-5.6-terra --config model_reasoning_effort='"medium"' --config model_verbosity='"low"' $Task
} else {
  codex -m gpt-5.6-terra --config model_reasoning_effort='"medium"' --config model_verbosity='"low"'
}
