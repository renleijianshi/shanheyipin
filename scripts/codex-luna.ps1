param([string]$Task="")
if ($Task) {
  codex exec -m gpt-5.6-luna --config model_reasoning_effort='"low"' --config model_verbosity='"low"' $Task
} else {
  codex -m gpt-5.6-luna --config model_reasoning_effort='"low"' --config model_verbosity='"low"'
}
