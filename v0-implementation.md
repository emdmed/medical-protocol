Actionable gaps with v0 solutions                                                                                                                                       
                                                            
  1. Quick Calculator — use v0's chat-native calculation                                                                                                                  
                                                                                                                                                                          
  v0 doesn't have a terminal CLI like medprotocol, but it doesn't need one. v0's Claude can answer quick calculations directly in chat text — BMI, ABG analysis, PaFi,
  fluid balance, DKA evaluation. The v0 protocol is missing this entire section. Claude Code has a cli domain in its Classification table; v0 needs an equivalent that
  routes to "answer in chat" instead of "run CLI."

  2. Workflow Execution section — completely missing

  The v0 protocol has a Classification table that references workflows/vital-signs.md, workflows/acid-base.md, etc. — but never tells Claude how to execute them. Claude
  Code has a detailed "Workflow Execution" section (lines 131–166) explaining fetch → follow phases → fetch components. v0's protocol jumps from Classification straight
  to Privacy. This is the biggest structural gap.

  3. Returning to Existing Project — v0 Projects support this

  v0 docs confirm Projects let multiple chats contribute to the same app. Claude Code has a "Returning to an Existing Project" section (lines 72–79). v0 protocol has
  nothing for this. Needs guidance on: detect existing components, route to customize workflow, don't re-fetch already-installed components.

  4. v0 Instructions — reduce prompt friction

  v0 supports custom Instructions (reusable prompts activated with a checkbox). Right now doctors must paste a long URL every time. We could document how to create a v0
  Instruction that auto-loads the protocol, so doctors just check a box and describe their need.
