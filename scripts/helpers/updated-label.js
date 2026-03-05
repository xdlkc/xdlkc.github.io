function formatDate(input) {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function buildUpdatedLabel({ date, updated }) {
  const publishedDay = formatDate(date);
  const updatedDay = formatDate(updated);

  if (!updatedDay) return '';
  if (publishedDay && publishedDay === updatedDay) return '';

  return ` · 更新于 ${updatedDay}`;
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('updated_label', function updatedLabel() {
    return buildUpdatedLabel({
      date: this.page && this.page.date,
      updated: this.page && this.page.updated
    });
  });
}

module.exports = {
  buildUpdatedLabel
};
