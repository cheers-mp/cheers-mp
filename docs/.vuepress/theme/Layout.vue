<template>
  <div>
    <ParentLayout> </ParentLayout>
    <Cat style="position: fixed; right: 0; bottom: 50px;" />
  </div>
</template>

<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue'
export default {
  name: 'Layout',
  components: {
    ParentLayout,
  }
}
</script>
