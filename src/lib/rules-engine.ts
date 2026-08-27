import { RuleCondition, RuleAction, RuleDto, TransactionDto } from "@/types";

export function evaluateCondition(
  condition: RuleCondition,
  tx: Partial<TransactionDto>
): boolean {
  const { field, operator, value } = condition;

  switch (field) {
    case "merchant": {
      const target = (tx.merchantName || tx.cleanName || tx.originalName || "").toLowerCase();
      const val = String(value).toLowerCase();
      if (operator === "contains") return target.includes(val);
      if (operator === "equals") return target === val;
      if (operator === "starts_with") return target.startsWith(val);
      return false;
    }
    case "originalName": {
      const target = (tx.originalName || "").toLowerCase();
      const val = String(value).toLowerCase();
      if (operator === "contains") return target.includes(val);
      if (operator === "equals") return target === val;
      if (operator === "starts_with") return target.startsWith(val);
      return false;
    }
    case "amount": {
      const txAmt = Math.abs(tx.amount || 0);
      const valNum = Number(value);
      if (operator === "greater_than") return txAmt > valNum;
      if (operator === "less_than") return txAmt < valNum;
      if (operator === "equals") return Math.abs(txAmt - valNum) < 0.01;
      return false;
    }
    case "accountId": {
      return String(tx.accountId) === String(value);
    }
    default:
      return false;
  }
}

export function applyActions(
  actions: RuleAction[],
  tx: Partial<TransactionDto>
): Partial<TransactionDto> {
  const modified = { ...tx };

  for (const action of actions) {
    switch (action.type) {
      case "set_category":
        modified.categoryId = String(action.value);
        break;
      case "rename_merchant":
        modified.cleanName = String(action.value);
        modified.merchantName = String(action.value);
        break;
      case "add_tag":
        if (!modified.tags) modified.tags = [];
        const tag = String(action.value);
        if (!modified.tags.includes(tag)) {
          modified.tags = [...modified.tags, tag];
        }
        break;
      case "exclude_budget":
        modified.isExcludedFromBudget = Boolean(action.value);
        break;
    }
  }

  return modified;
}

export function runRulesOnTransaction(
  tx: Partial<TransactionDto>,
  rules: RuleDto[]
): Partial<TransactionDto> {
  let processed = { ...tx };
  const sortedRules = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    const isMatch = rule.conditions.every((cond) =>
      evaluateCondition(cond, processed)
    );
    if (isMatch) {
      processed = applyActions(rule.actions, processed);
    }
  }

  return processed;
}
