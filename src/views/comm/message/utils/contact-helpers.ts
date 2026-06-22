export type CommContactPerson = {
  key: string;
  label: string;
  title?: string;
  phone?: string;
  company?: string;
  deptPath: string;
};

export function flattenContactPersons(nodes: Api.Comm.ContactNode[], parentPath = ''): CommContactPerson[] {
  const result: CommContactPerson[] = [];
  nodes.forEach(node => {
    const path = parentPath ? `${parentPath} / ${node.label}` : node.label;
    if (node.type === 'person') {
      result.push({
        key: node.key,
        label: node.label,
        title: node.title,
        phone: node.phone,
        company: node.company,
        deptPath: parentPath || node.label
      });
    }
    if (node.children?.length) {
      result.push(...flattenContactPersons(node.children, node.type === 'dept' ? path : parentPath));
    }
  });
  return result;
}
