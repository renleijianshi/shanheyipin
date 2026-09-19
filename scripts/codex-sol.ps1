param([string]$Task="")
if ($Task) {
  codex exec -m gpt-5.6-sol --config model_reasoning_effort='"high"' --config model_verbosity='"low"' $Task
} else {
  codex -m gpt-5.6-sol --config model_reasoning_effort='"high"' --config model_verbosity='"low"'
}
