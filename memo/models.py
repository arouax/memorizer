from django.db import models
from django.conf import settings


# Create your models here.
class Word(models.Model):
    POS_CHOICES = (
        ('NN', 'Noun'),
        ('VB', 'Verb'),
        ('ADJ', 'Adjective'),
        ('ADV', 'Adverb'),
    )
    wordcontent = models.CharField(max_length=100)
    translation = models.CharField(max_length=100)
    context = models.CharField(max_length=100, blank=True, null=True)
    pos = models.CharField(
        max_length=3,
        choices=POS_CHOICES,
        verbose_name='Part of speech'
    )
    known = models.BooleanField(default=False)
    shown = models.IntegerField(
        verbose_name='Times shown',
        default = 0,
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL)

    def __str__(self):
        return self.wordcontent

    def as_dict(self):
        obj_dict = {
            'pk': self.pk,
            'wordcontent': self.wordcontent,
            'translation': self.translation,
            'pos': self.pos,
        }
        if self.context:
            obj_dict['context'] = self.context
        return obj_dict
