from django.forms import Form, ModelForm, MultipleChoiceField
from jsonattrs.mixins import template_xlang_labels
from jsonattrs.forms import form_field_from_name
from django.contrib.contenttypes.models import ContentType
from tutelary.models import Role

from .mixins import SchemaSelectorMixin
from .widgets import XLangSelect, XLangSelectMultiple


class SuperUserCheck:

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._su_role = None

    def is_superuser(self, user):
        if not hasattr(self, 'su_role'):
            self.su_role = Role.objects.get(name='superuser')

        return any([isinstance(pol, Role) and pol == self.su_role
                    for pol in user.assigned_policies()])


class AttributeFormMixin(SchemaSelectorMixin):
    def create_model_fields(self, field_prefix, attribute_map, new_item=False):
        for selector, attributes in attribute_map.items():
            for name, attr in attributes.items():
                fieldname = '{}::{}::{}'.format(
                    field_prefix, selector.lower(), name)
                atype = attr.attr_type
                args = {'label': attr.long_name, 'required': attr.required}
                field = form_field_from_name(atype.form_field)
                if not new_item:
                    self.set_initial(args, attr.name, attr)
                if atype.form_field in ['ChoiceField', 'MultipleChoiceField']:
                    if (attr.choice_labels is not None and
                            attr.choice_labels != []):
                        chs = list(zip(attr.choices, attr.choice_labels))
                    else:
                        chs = [(c, c) for c in attr.choices]
                    args['choices'] = chs
                if atype.form_field == 'BooleanField':
                    args['required'] = attr.required
                    if len(attr.default) > 0:
                        self.set_default(args, attr, boolean=True)
                else:
                    if attr.required and new_item:
                        args['required'] = True
                    if len(attr.default) > 0 and len(
                            args.get('initial', '')) == 0:
                        self.set_default(args, attr)
                f = field(**args)

                if hasattr(f.widget, 'choices'):
                    try:
                        xlang_labels = dict(zip(attr.choices,
                                                attr.choice_labels_xlat))
                    except TypeError:
                        xlang_labels = {}

                    widget_args = {
                        'attrs': f.widget.attrs,
                        'choices': f.widget.choices,
                        'xlang_labels': xlang_labels
                    }

                    if isinstance(f, MultipleChoiceField):
                        f.widget = XLangSelectMultiple(**widget_args)
                    else:
                        f.widget = XLangSelect(**widget_args)

                f.labels_xlang = template_xlang_labels(attr.long_name_xlat)
                self.fields[fieldname] = f

    def set_default(self, args, attr, boolean=False):
        if len(attr.default) > 0:
            if boolean:
                args['initial'] = (attr.default != 'False')
            else:
                args['initial'] = attr.default

    def set_initial(self, args, name, attr):
        if hasattr(self, 'instance'):
            attrvals = getattr(self.instance, self.attributes_field)
            if name in attrvals:
                if attr.attr_type.form_field == 'BooleanField':
                    args['initial'] = (
                        attrvals[name]
                        if isinstance(attrvals[name], bool)
                        else attrvals[name] != 'False'
                    )
                else:
                    args['initial'] = attrvals.get(name, None)

    def process_attributes(self, key, entity_type=''):
        attributes = {}
        for k, v in self.cleaned_data.items():
            if k.startswith(key + '::'):
                _, type, name = k.split('::')
                if type in [entity_type.lower(), 'default']:
                    attributes[name] = v
        if hasattr(self, 'instance'):
            setattr(self.instance, self.attributes_field, attributes)
        else:
            return attributes


class AttributeForm(AttributeFormMixin, Form):
    def add_attribute_fields(self, content_type):
        label = '{}.{}'.format(content_type.app_label, content_type.model)
        attributes = self.get_model_attributes(self.project, label)
        new_item = self.data.get('new_item') == 'on'
        self.create_model_fields(
            content_type.model, attributes, new_item=new_item
        )


class AttributeModelForm(AttributeFormMixin, ModelForm):
    def add_attribute_fields(self):
        content_type = ContentType.objects.get_for_model(self.Meta.model)
        label = '{}.{}'.format(content_type.app_label, content_type.model)
        attributes = self.get_model_attributes(self.project, label)
        new_item = self.data.get('new_item') == 'on'
        self.create_model_fields(
            content_type.model, attributes, new_item=new_item
        )

    def save(self, *args, **kwargs):
        entity_type = kwargs.get('entity_type', '')
        project_id = kwargs.get('project_id', None)
        instance = super().save(commit=False)
        content_type = ContentType.objects.get_for_model(instance)
        if self.attributes_field is not None:
            self.process_attributes(content_type.model, entity_type)
        if project_id is not None and hasattr(instance, 'project_id'):
            setattr(instance, 'project_id', project_id)
        return super().save()
