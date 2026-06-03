<script setup lang="ts">
defineOptions({ name: 'PdaPhoneShell' });
</script>

<template>
  <div class="pda-stage">
    <div class="iphone-device" role="presentation">
      <div class="iphone-btn iphone-btn-silent" />
      <div class="iphone-btn iphone-btn-vol-up" />
      <div class="iphone-btn iphone-btn-vol-down" />
      <div class="iphone-btn iphone-btn-power" />
      <div class="iphone-bezel">
        <div class="iphone-screen">
          <div class="iphone-status-bar">
            <span class="iphone-time">9:41</span>
            <div class="iphone-dynamic-island" />
            <div class="iphone-status-icons" aria-hidden="true">
              <span class="iphone-signal" />
              <span class="iphone-wifi" />
              <span class="iphone-battery" />
            </div>
          </div>
          <div class="iphone-content">
            <slot />
          </div>
          <div class="iphone-home-indicator" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pda-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 24px 16px 32px;
  background: radial-gradient(ellipse at 50% 0%, #c4b8ff 0%, #e8eaf6 45%, #f0f2f8 100%);
  box-sizing: border-box;
}

.iphone-device {
  position: relative;
  width: 340px;
  max-width: calc(100vw - 48px);
  filter: drop-shadow(0 24px 40px rgba(30, 20, 80, 0.26)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.1));
}

.iphone-bezel {
  position: relative;
  padding: 12px 9px 16px;
  border-radius: 45px;
  background: linear-gradient(145deg, #3d3d3f 0%, #1c1c1e 35%, #0a0a0b 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.iphone-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 680px;
  max-height: calc(100vh - 180px);
  border-radius: 36px;
  overflow: hidden;
  background: #000;
  box-shadow: inset 0 0 0 2px #111;
}

.iphone-status-bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 43px;
  padding: 7px 18px 0;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  pointer-events: none;
  flex-shrink: 0;
}

.iphone-time {
  width: 50px;
}

.iphone-dynamic-island {
  position: absolute;
  left: 50%;
  top: 9px;
  transform: translateX(-50%);
  width: 104px;
  height: 32px;
  border-radius: 18px;
  background: #000;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.iphone-status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 50px;
  justify-content: flex-end;
}

.iphone-signal,
.iphone-wifi,
.iphone-battery {
  display: inline-block;
  background: #fff;
  border-radius: 1px;
}

.iphone-signal {
  width: 16px;
  height: 10px;
  clip-path: polygon(0 100%, 25% 60%, 50% 80%, 75% 40%, 100% 70%, 100% 100%);
}

.iphone-wifi {
  width: 14px;
  height: 10px;
  border-radius: 50% 50% 0 0;
  opacity: 0.9;
}

.iphone-battery {
  position: relative;
  width: 22px;
  height: 10px;
  border: 1.5px solid #fff;
  border-radius: 2px;
  box-sizing: border-box;
}

.iphone-battery::after {
  content: '';
  position: absolute;
  right: -4px;
  top: 2px;
  width: 2px;
  height: 5px;
  background: #fff;
  border-radius: 0 1px 1px 0;
}

.iphone-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.iphone-content::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.iphone-home-indicator {
  flex-shrink: 0;
  height: 20px;
  padding-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.iphone-home-indicator::before {
  content: '';
  width: 112px;
  height: 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.35);
}

/* Side buttons */
.iphone-btn {
  position: absolute;
  background: linear-gradient(90deg, #2a2a2c, #1a1a1c);
  border-radius: 2px;
  z-index: 1;
}

.iphone-btn-silent {
  left: -3px;
  top: 95px;
  width: 3px;
  height: 24px;
}

.iphone-btn-vol-up {
  left: -3px;
  top: 136px;
  width: 3px;
  height: 38px;
}

.iphone-btn-vol-down {
  left: -3px;
  top: 184px;
  width: 3px;
  height: 38px;
}

.iphone-btn-power {
  right: -3px;
  top: 147px;
  width: 3px;
  height: 56px;
}

@media (max-width: 480px) {
  .pda-stage {
    padding: 12px 8px;
    min-height: auto;
  }

  .iphone-device {
    width: 100%;
  }

  .iphone-screen {
    height: min(680px, calc(100vh - 120px));
  }
}
</style>
