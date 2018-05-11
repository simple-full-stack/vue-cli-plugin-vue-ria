import { FormView, createView } from 'sfs-vue-ria';
import { Field, Input } from 'veui';
import formModule from './formModule';

export default createView(FormView, formModule, {
  name: 'demo-form-view',
  render() {
    const Parent = this.getComponent('form-view');
    return <Parent class={this.$options.name}>
      <Field
        field="name"
        label="姓名"
        rules="required"
        slot="field"
      ><Input /></Field>
      <Field
        field="age"
        label="年龄"
        slot="field"
      ><Input /></Field>
    </Parent>;
  },
});
