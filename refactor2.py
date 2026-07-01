import os

file_path = "BE/src/v1/poker-lobby/poker-game.service.ts"
with open(file_path, 'r') as f:
    lines = f.readlines()

def find_line(pattern, start=0):
    for i in range(start, len(lines)):
        if pattern in lines[i]:
            return i
    return -1

# 1. Locate processShowdown end
ps_rake_start = find_line("const rakeRate = dbTable ? dbTable.rake_rate : 5.0;")
ps_end = find_line("  }", ps_rake_start)

# 2. Locate endHandEarly rake start and end
ehe_start = find_line("  private async endHandEarly")
ehe_rake_start = find_line("    // 2. Khấu trừ Rake", ehe_start)
ehe_end = find_line("  }", ehe_rake_start)

# Extract the finalize logic from endHandEarly
finalize_logic = "".join(lines[ehe_rake_start:ehe_end])

# Create the new method
finalize_method = """  private async finalizeAndBroadcastHand(
    roomId: string,
    winnersLog: any[],
    totalPotAmount: number,
    tableState: any,
    seats: any[]
  ) {
""" + finalize_logic + "  }\n\n"

# Rewrite endHandEarly
ehe_replacement = """    await this.finalizeAndBroadcastHand(roomId, winnersLog, winAmount, tableState, seats);
"""

# Rewrite processShowdown
ps_replacement = """    await this.finalizeAndBroadcastHand(roomId, winnersLog, totalPotAmount, tableState, seats);
"""

new_lines = []
i = 0
while i < len(lines):
    if i == ps_rake_start:
        new_lines.append(ps_replacement)
        i = ps_end # skip to end of processShowdown
    elif i == ehe_rake_start:
        new_lines.append(ehe_replacement)
        i = ehe_end # skip to end of endHandEarly
    elif i == ehe_end + 1:
        new_lines.append(lines[i]) # maybe blank line
        new_lines.append(finalize_method)
        i += 1
    else:
        new_lines.append(lines[i])
        i += 1

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Refactored finalizeHand.")
